package com.example.queue_project.repository;

import io.micrometer.common.lang.Nullable;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long user_id;
    private Long password_hash;
    private String first_name;
    private String last_name;
    private String middle_name;
    private String email;
    private LocalDate birth_date;
    @Nullable
    private Integer group_id;

        public User(Long id, Long password_hash, String last_name, String patronymic, @Nullable Integer group_id, LocalDate birth, String email, String first_name) {
            this.user_id = id;
            this.password_hash = password_hash;
            this.last_name = last_name;
            this.middle_name = patronymic;
            this.group_id = group_id;
            this.birth_date = birth;
            this.email = email;
            this.first_name = first_name;
        }

    public User() {
    }

    public Long getId() {
        return user_id;
    }

    public void setId(Long id) {
        this.user_id = id;
    }

    @Nullable
    public Integer getGroup_id() {
        return group_id;
    }

    public void setGroup_id(@Nullable Integer group_id) {
        this.group_id = group_id;
    }

    public LocalDate getBirth() {
        return birth_date;
    }

    public void setBirth(LocalDate birth) {
        this.birth_date = birth;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPatronymic() {
        return middle_name;
    }

    public void setPatronymic(String patronymic) {
        this.middle_name = patronymic;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public Long getPassword_hash() {
        return password_hash;
    }

    public void setPassword_hash(Long password_hash) {
        this.password_hash = password_hash;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + user_id +
                ", password_hash=" + password_hash +
                ", first_name='" + first_name + '\'' +
                ", last_name='" + last_name + '\'' +
                ", patronymic='" + middle_name + '\'' +
                ", email='" + email + '\'' +
                ", birth=" + birth_date +
                ", role=" + group_id +
                '}';
    }
}

