package com.example.queue_project.repository;

import com.example.queue_project.repository.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {
    boolean existsByGroupId(Long groupId);
    @Query(value = "select group_id from student_groups where group_name = :groupName", nativeQuery = true)
    Optional<Integer> findByGroupName(String groupName);
}
