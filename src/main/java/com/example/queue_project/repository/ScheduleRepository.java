package com.example.queue_project.repository;

import com.example.queue_project.repository.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Находит все записи расписания по ID группы
     * @param groupId ID группы
     * @return Список объектов Schedule
     */
    List<Schedule> findByGroupId(Long groupId);
}