package com.example.queue_project.dto;

public class AuthRequest {
    private String email;
    private Long password_hash;

    public AuthRequest(String email, Long password_hash) {
        this.email = email;
        this.password_hash = password_hash;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getPassword_hash() {
        return password_hash;
    }

    public void setPassword_hash(Long password_hash) {
        this.password_hash = password_hash;
    }

    @Override
    public String toString() {
        return "AuthRequest{" +
                "email='" + email + '\'' +
                ", password_hash=" + password_hash +
                '}';
    }
}
