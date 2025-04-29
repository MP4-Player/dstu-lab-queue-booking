package com.example.queue_project.controller;

import com.example.queue_project.dto.AuthRequest;
import com.example.queue_project.dto.UserCreateRequest;
import com.example.queue_project.repository.User;
import com.example.queue_project.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> findAll(){
        return  userService.findAll();
    }

    @PostMapping
    public User create(@RequestBody UserCreateRequest request) {
        return userService.create(request);
    }

    @DeleteMapping(path = "/{id}")
    public  void delete(@PathVariable(name = "id") Long id){
        userService.delete(id);
    }

    @PutMapping(path = "/{id}")
    public void update(
            @PathVariable(name = "id") Long id,
            @RequestBody UserCreateRequest request
    ) {
        userService.update(
                id,
                request.getEmail(),
                request.getPassword_hash(),
                request.getFirst_name(),
                request.getLast_name(),
                request.getMiddle_name(),
                request.getGroup_name()
        );
        }

    @PostMapping("/login")
        public User login(@RequestBody AuthRequest request){
            return userService.authenticate(request);
    }



}
