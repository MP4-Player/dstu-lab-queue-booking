package com.example.queue_project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    boolean existsByGroupId(Long groupId);

    @Query("SELECT g.groupId FROM Group g")
    List<Long> findAllGroupIds();
}