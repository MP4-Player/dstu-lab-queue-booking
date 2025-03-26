package com.example.queue_project.service;

import com.example.queue_project.repository.Schedule;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
public class ScheduleService {
    public List<Schedule> getSchedule(){
        return List.of(new Schedule(
                1L,                                  // scheduleId
                101L,                                // subjectId
                2001L,                               // groupId
                3001L,                               // teacherId
                "А-301",                             // classroom
                Timestamp.valueOf("2024-03-25 10:30:00"), // dateTime
                "Лекция"));
    }
}
