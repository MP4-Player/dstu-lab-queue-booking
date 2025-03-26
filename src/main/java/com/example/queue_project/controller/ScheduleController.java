package com.example.queue_project.controller;

import com.example.queue_project.repository.Schedule;
import com.example.queue_project.service.ScheduleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.util.List;

@RestController
public class ScheduleController {
    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }


    @GetMapping
    public List<Schedule> getSchedule(){
        return scheduleService.getSchedule();
    }
}
