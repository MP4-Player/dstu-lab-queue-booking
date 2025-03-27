package com.example.queue_project.controller;

import com.example.queue_project.repository.Group;
import com.example.queue_project.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    @Autowired
    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    /**
     * Загружает группы из API ДГТУ и сохраняет их в базу данных
     * @return информацию о количестве загруженных групп
     */
    @PostMapping("/load")
    public ResponseEntity<Map<String, Object>> loadGroups() {
        int count = groupService.loadGroupsFromApi();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Группы успешно загружены",
                "count", count
        ));
    }

    /**
     * Получает все группы из базы данных
     * @return список всех групп
     */
    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        List<Group> groups = groupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }

    @PostMapping("/test-insert")
    public ResponseEntity<Map<String, Object>> testDirectInsert() {
        groupService.insertTestGroupDirectly();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Тестовая вставка выполнена, проверьте логи"
        ));
    }
}
