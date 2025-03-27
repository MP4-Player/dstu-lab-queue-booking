package com.example.queue_project.scheduler;

import com.example.queue_project.service.GroupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GroupDataScheduler {

    private static final Logger log = LoggerFactory.getLogger(GroupDataScheduler.class);

    private final GroupService groupService;

    @Autowired
    public GroupDataScheduler(GroupService groupService) {
        this.groupService = groupService;
    }

    /**
     * Автоматически загружает группы из API каждый день в 3 часа ночи
     */
    @Scheduled(cron = "0 0 3 * * ?") // Выполнять в 3:00 каждый день
    public void scheduleGroupDataUpdate() {
        log.info("Выполняется запланированное обновление данных о группах");
        try {
            int count = groupService.loadGroupsFromApi();
            log.info("Запланированное обновление данных о группах завершено, добавлено {} новых групп", count);
        } catch (Exception e) {
            log.error("Ошибка при выполнении запланированного обновления данных о группах: {}", e.getMessage(), e);
        }
    }

    /**
     * Загружает группы при запуске приложения
     */
    @Scheduled(initialDelay = 10000, fixedDelay = Long.MAX_VALUE)
    public void loadGroupsOnStartup() {
        log.info("Загрузка данных о группах при запуске приложения");
        try {
            int count = groupService.loadGroupsFromApi();
            log.info("Загрузка данных о группах при запуске приложения завершена, добавлено {} новых групп", count);
        } catch (Exception e) {
            log.error("Ошибка при загрузке данных о группах при запуске приложения: {}", e.getMessage(), e);
        }
    }
}