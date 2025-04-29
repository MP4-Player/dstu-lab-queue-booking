package com.example.queue_project.controller;

import com.example.queue_project.service.ScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {
    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    /**
     * Заполняет/обновляет расписание для конкретной группы
     * @param groupId ID группы
     * @return ResponseEntity с результатом операции
     */
    @PostMapping("/fill/{groupId}")
    public ResponseEntity<Map<String, Object>> fillScheduleForGroup(
            @PathVariable Long groupId) {
        try {
            int count = scheduleService.fillScheduleForGroup(groupId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Расписание для группы " + groupId + " успешно заполнено",
                    "recordsAdded", count,
                    "groupId", groupId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Ошибка при заполнении расписания: " + e.getMessage(),
                            "groupId", groupId
                    ));
        }
    }
    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getScheduleByGroup(
            @PathVariable Long groupId) {
        try {
            return ResponseEntity.ok(scheduleService.getSchedulesByGroupId(groupId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Расписание не найдено",
                            "message", e.getMessage()
                    ));
        }
    }

}