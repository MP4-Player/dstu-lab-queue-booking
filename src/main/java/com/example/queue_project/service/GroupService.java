package com.example.queue_project.service;

import com.example.queue_project.dto.ApiResponseDto;
import com.example.queue_project.repository.Group;
import com.example.queue_project.repository.GroupRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.transaction.Transactional;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class GroupService {
    private static final Logger log = LoggerFactory.getLogger(GroupService.class);
    private static final String API_URL = "https://edu.donstu.ru/api/raspGrouplist";
    private static final String CACHE_FILE = "groups_cache.json";

    private final GroupRepository groupRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Флаг для отслеживания активного процесса загрузки
    private AtomicBoolean isLoadingInProgress = new AtomicBoolean(false);

    @Autowired
    public GroupService(GroupRepository groupRepository, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.groupRepository = groupRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Тестовый метод для прямой вставки группы через JDBC
     */
    public void insertTestGroupDirectly() {
        try {
            int result = jdbcTemplate.update(
                    "INSERT INTO student_groups (group_id, group_name) VALUES (?, ?)",
                    100000L, "Test Direct Insert"
            );
            log.info("Прямая вставка через JDBC, результат: {} строк добавлено", result);
        } catch (Exception e) {
            log.error("Ошибка при прямой вставке: {}", e.getMessage(), e);
        }
    }

    /**
     * Проверка настроек автокоммита в базе данных
     */
    public void checkDatabaseSettings() {
        try {
            String autocommitValue = jdbcTemplate.queryForObject(
                    "SHOW VARIABLES LIKE 'autocommit'",
                    (rs, rowNum) -> rs.getString("Value")
            );
            log.info("Настройка autocommit в MySQL: {}", autocommitValue);

            List<Map<String, Object>> privileges = jdbcTemplate.queryForList(
                    "SHOW GRANTS FOR CURRENT_USER()"
            );
            log.info("Права текущего пользователя: {}", privileges);
        } catch (Exception e) {
            log.error("Ошибка при проверке настроек БД: {}", e.getMessage(), e);
        }
    }

    /**
     * Загружает данные о группах из API, кэширует их в файл и сохраняет в базу данных
     * с использованием оптимизированных JDBC запросов
     * @return количество загруженных групп
     */
    @Transactional
    public int loadGroupsFromApi() {
        // Если загрузка уже идет, не начинаем еще одну
        if (!isLoadingInProgress.compareAndSet(false, true)) {
            log.info("Загрузка групп уже выполняется, дополнительный запрос отклонен");
            return -1; // Возвращаем -1, чтобы показать, что загрузка уже идет
        }

        log.info("Начало загрузки групп из API");

        try {
            // Проверяем настройки БД перед началом работы
            checkDatabaseSettings();

            // Получаем данные из API и кэшируем их в файл
            ApiResponseDto response = fetchAndCacheApiResponse();

            if (response == null || response.getData() == null) {
                log.error("API вернул пустой ответ");
                return 0;
            }

            // Выводим общее количество групп
            int totalGroups = response.getData().size();
            log.info("Общее количество групп в ответе API: {}", totalGroups);

            // Создаем список объектов Group из DTO
            List<Group> groupsToSave = new ArrayList<>();

            for (int i = 0; i < response.getData().size(); i++) {
                var groupDto = response.getData().get(i);
                if (groupDto.getId() != null && groupDto.getName() != null) {
                    Group group = new Group(groupDto.getId(), groupDto.getName());
                    groupsToSave.add(group);
                }

                // Логируем прогресс каждые 100 групп
                if ((i + 1) % 100 == 0 || i == response.getData().size() - 1) {
                    log.info("Обработано {} из {} групп", i + 1, totalGroups);
                }
            }

            log.info("Подготовлено {} групп для сохранения", groupsToSave.size());

            // Используем многострочные INSERT IGNORE запросы для эффективной вставки
            int savedCount = 0;
            int batchSize = 100;

            for (int i = 0; i < groupsToSave.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, groupsToSave.size());
                List<Group> batch = groupsToSave.subList(i, endIndex);

                if (!batch.isEmpty()) {
                    StringBuilder queryBuilder = new StringBuilder(
                            "INSERT IGNORE INTO student_groups (group_id, group_name) VALUES "
                    );

                    // Создаем параметры для всех значений в пакете
                    Object[] params = new Object[batch.size() * 2];
                    int paramIndex = 0;

                    for (int j = 0; j < batch.size(); j++) {
                        if (j > 0) {
                            queryBuilder.append(", ");
                        }
                        queryBuilder.append("(?, ?)");

                        Group group = batch.get(j);
                        params[paramIndex++] = group.getGroupId();
                        params[paramIndex++] = group.getGroupName();
                    }

                    // Выполняем многострочную вставку одним запросом
                    int affected = jdbcTemplate.update(queryBuilder.toString(), params);
                    savedCount += affected;

                    log.info("Сохранена партия из {} групп (добавлено: {}). Всего сохранено: {}/{}",
                            batch.size(), affected, savedCount, groupsToSave.size());

                    // Проверяем текущее количество групп в БД
                    if (i % 500 == 0 || i + batchSize >= groupsToSave.size()) {
                        int count = jdbcTemplate.queryForObject(
                                "SELECT COUNT(*) FROM student_groups", Integer.class);
                        log.info("Текущее количество групп в БД: {}", count);
                    }
                }
            }

            log.info("Всего сохранено {} новых групп в базу данных", savedCount);

            // Финальная проверка данных
            int finalCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM student_groups", Integer.class);
            log.info("Итоговое количество групп в БД после всех операций: {}", finalCount);

            return savedCount;
        } catch (Exception e) {
            log.error("Ошибка при загрузке групп из API: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка при загрузке групп из API", e);
        } finally {
            // Обязательно сбрасываем флаг загрузки при завершении, даже если произошла ошибка
            isLoadingInProgress.set(false);
            log.info("Процесс загрузки групп завершен, флаг загрузки сброшен");
        }
    }

    /**
     * Получает все группы из базы данных с использованием JPA
     * @return список всех групп
     */
    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    /**
     * Альтернативный метод получения групп напрямую через JDBC
     * @return список всех групп
     */
    public List<Group> getAllGroupsJdbc() {
        return jdbcTemplate.query(
                "SELECT * FROM student_groups",
                (rs, rowNum) -> new Group(
                        rs.getLong("group_id"),
                        rs.getString("group_name")
                )
        );
    }

    /**
     * Получает данные из API и кэширует их в файл
     * @return ответ API в виде объекта ApiResponseDto
     */
    private ApiResponseDto fetchAndCacheApiResponse() throws IOException {
        // Проверяем наличие кэш-файла
        Path cachePath = Paths.get(CACHE_FILE);
        ApiResponseDto response;

        log.info("Запрос данных из API (один раз): {}", API_URL);
        String jsonResponse = restTemplate.getForObject(API_URL, String.class);

        if (jsonResponse != null) {
            // Сохраняем ответ в кэш-файл
            Files.write(cachePath, jsonResponse.getBytes());
            log.info("Данные успешно сохранены в кэш-файл: {}", cachePath.toAbsolutePath());

            // Десериализуем ответ
            response = objectMapper.readValue(jsonResponse, ApiResponseDto.class);
            return response;
        } else {
            log.error("API вернул null-ответ");
            return null;
        }
    }
}