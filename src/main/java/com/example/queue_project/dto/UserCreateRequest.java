package com.example.queue_project.dto;
import java.time.LocalDate;

public class UserCreateRequest {
    private String first_name;
    private String last_name;
    private String middle_name;
    private String email;
    private LocalDate birth_date;
    private Long password_hash;
    private String group_name;

    public UserCreateRequest(String first_name, String last_name, String middle_name, String email, LocalDate birth_date, Long password_hash, String group_name) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.middle_name = middle_name;
        this.email = email;
        this.birth_date = birth_date;
        this.password_hash = password_hash;
        this.group_name = group_name;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public String getGroup_name() {
        return group_name;
    }

    public void setGroup_name(String group_name) {
        this.group_name = group_name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getMiddle_name() {
        return middle_name;
    }

    public void setMiddle_name(String middle_name) {
        this.middle_name = middle_name;
    }

    public LocalDate getBirth_date() {
        return birth_date;
    }

    public void setBirth_date(LocalDate birth_date) {
        this.birth_date = birth_date;
    }

    public Long getPassword_hash() {
        return password_hash;
    }

    public void setPassword_hash(Long password_hash) {
        this.password_hash = password_hash;
    }

    @Override
    public String toString() {
        return "UserCreateRequest{" +
                "first_name='" + first_name + '\'' +
                ", last_name='" + last_name + '\'' +
                ", middle_name='" + middle_name + '\'' +
                ", email='" + email + '\'' +
                ", birth_date=" + birth_date +
                ", password_hash=" + password_hash +
                ", group_name='" + group_name + '\'' +
                '}';
    }
}

