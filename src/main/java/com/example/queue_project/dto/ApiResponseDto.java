package com.example.queue_project.dto;

import java.util.List;

public class ApiResponseDto {
    private List<GroupDto> data;

    public List<GroupDto> getData() {
        return data;
    }

    public void setData(List<GroupDto> data) {
        this.data = data;
    }
}