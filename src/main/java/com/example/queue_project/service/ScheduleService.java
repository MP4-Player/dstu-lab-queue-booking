package com.example.queue_project.service;

import com.example.queue_project.dto.ScheduleApiResponse;
import com.example.queue_project.repository.Schedule;
import com.example.queue_project.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.sql.Timestamp;
import java.util.List;

@Service
public class ScheduleService {
    private final RestTemplate restTemplate;
    private final ScheduleRepository scheduleRepository;

    @Value("${schedule.api.url}")
    private String scheduleApiUrl;

    public ScheduleService(RestTemplate restTemplate,
                           ScheduleRepository scheduleRepository) {
        this.restTemplate = restTemplate;
        this.scheduleRepository = scheduleRepository;
    }

    /**
     * Загружает и сохраняет расписание только для указанной группы
     * @param groupId ID группы
     * @return количество загруженных записей
     */
    @Transactional
    public int fillScheduleForGroup(Long groupId) {
        // Очищаем существующее расписание для этой группы

        String apiUrl = scheduleApiUrl + "?idGroup=" + groupId;
        try {
            ScheduleApiResponse response = restTemplate.getForObject(apiUrl, ScheduleApiResponse.class);

            if (response == null || response.getData() == null || response.getData().getRasp() == null) {
                return 0;
            }

            int count = 0;
            for (ScheduleApiResponse.Rasp raspItem : response.getData().getRasp()) {
                if (isValidScheduleItem(raspItem)) {
                    Schedule schedule = createScheduleFromRaspItem(raspItem);
                    scheduleRepository.save(schedule);
                    count++;
                }
            }
            return count;
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при загрузке расписания для группы " + groupId, e);
        }
    }

    /**
     * Проверяет валидность элемента расписания
     */
    private boolean isValidScheduleItem(ScheduleApiResponse.Rasp raspItem) {
        return raspItem.getScheduleId() != null &&
                raspItem.getGroupId() != null &&
                raspItem.getStartDate() != null &&
                raspItem.getDiscipline() != null;
    }

    /**
     * Создает объект Schedule из элемента API
     */
    private Schedule createScheduleFromRaspItem(ScheduleApiResponse.Rasp raspItem) {
        Schedule schedule = new Schedule();
        schedule.setScheduleId(raspItem.getScheduleId());
        schedule.setSubject(raspItem.getDiscipline());
        schedule.setTeacher(raspItem.getTeacher());
        schedule.setGroupId(raspItem.getGroupId());
        schedule.setRoomNumber(raspItem.getClassroom());
        schedule.setScheduleData(parseTimestamp(raspItem.getStartDate()));
        return schedule;
    }

    /**
     * Преобразует строку даты в Timestamp
     */
    private Timestamp parseTimestamp(String dateTimeStr) {
        try {
            return dateTimeStr != null ?
                    Timestamp.valueOf(dateTimeStr.replace("T", " ")) :
                    null;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Неверный формат даты: " + dateTimeStr, e);
        }
    }
    public List<Schedule> getSchedulesByGroupId(Long groupId) {
        return scheduleRepository.findByGroupId(groupId);
    }
}