package com.example.queue_project.repository;

import com.example.queue_project.repository.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface GroupRepository extends JpaRepository<Group, Long> {
    boolean existsByGroupId(Long groupId);
}
