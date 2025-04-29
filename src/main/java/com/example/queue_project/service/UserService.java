package com.example.queue_project.service;

import com.example.queue_project.dto.AuthRequest;
import com.example.queue_project.dto.UserCreateRequest;
import com.example.queue_project.repository.GroupRepository;
import com.example.queue_project.repository.User;
import com.example.queue_project.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public UserService(UserRepository userRepository, GroupRepository groupRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    public List<User> findAll(){
        return userRepository.findAll();
    }

    public User create(UserCreateRequest request){
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isPresent()){
            throw new IllegalStateException("Пользователь с такой почтой существует!");
        }
        Optional<Integer> optionalGroupId = groupRepository.findByGroupName(request.getGroup_name());
        if (optionalGroupId.isEmpty()){
            throw new IllegalStateException("Группа с названием '" + request.getGroup_name() + "' не найдена!");
        }
        Integer groupId = optionalGroupId.get();
        User user = new User(
                null,
                request.getPassword_hash(),
                request.getLast_name(),
                request.getMiddle_name(),
                groupId,
                request.getBirth_date(),
                request.getEmail(),
                request.getFirst_name()
        );
        return userRepository.save(user);
    }

    public void delete(Long id){
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()){
            throw new IllegalStateException("Такого пользователя не существует!");
        }
        userRepository.deleteById(id);
    }
    @Transactional
    public void update(Long id, String email, Long passwordHash, String firstName, String lastName, String middleName, String groupName) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new IllegalStateException("Такого пользователя не существует!");
        }
        User user = optionalUser.get();
        if (email != null && !email.equals(user.getEmail())){
            Optional<User> findByEmail = userRepository.findByEmail(email);
            if (findByEmail.isPresent()){
                throw new IllegalStateException("Пользователь с такой почтой существует!");
            }
            user.setEmail(email);
        }
        if (passwordHash != null && !passwordHash.equals((user.getPassword_hash()))){
            user.setPassword_hash(passwordHash);
        }

        if (firstName != null && !firstName.equals(user.getFirst_name())) {
            user.setFirst_name(firstName);
        }

        if (lastName != null && !lastName.equals((user.getLast_name()))){
            user.setLast_name(lastName);
        }
        if (middleName != null && !middleName.equals((user.getPatronymic()))){
            user.setPatronymic(middleName);
        }
        if (groupName != null) {
            Optional<Integer> optionalGroupId = groupRepository.findByGroupName(groupName);
            if (optionalGroupId.isEmpty()) {
                throw new IllegalStateException("Группа с названием '" + groupName + "' не найдена!");
            }
            Integer groupId = optionalGroupId.get();
            user.setGroup_id(groupId);
        }

        System.out.println("Пользователь найден: " + user.getId());
        userRepository.save(user);
        System.out.println("Пользователь сохранён!");
    }

    public User authenticate(AuthRequest request){
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()){
            throw new IllegalStateException("Пользователь с такой почтой существует!");
        }
        User user = optionalUser.get();
        if (!user.getPassword_hash().equals(request.getPassword_hash())){
            throw new IllegalStateException("Неверный пароль!");
        }
        return user;
    }
}
