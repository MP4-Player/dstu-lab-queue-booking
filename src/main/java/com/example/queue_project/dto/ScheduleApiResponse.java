package com.example.queue_project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class ScheduleApiResponse {
    private Data data;

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public static class Data {
        @JsonProperty("isCyclicalSchedule")
        private Boolean isCyclicalSchedule;

        @JsonProperty("rasp")
        private List<Rasp> scheduleItems;

        public Boolean getIsCyclicalSchedule() {
            return isCyclicalSchedule;
        }

        public void setIsCyclicalSchedule(Boolean isCyclicalSchedule) {
            this.isCyclicalSchedule = isCyclicalSchedule;
        }

        public List<Rasp> getRasp() {
            return scheduleItems;
        }

        public void setRasp(List<Rasp> scheduleItems) {
            this.scheduleItems = scheduleItems;
        }
    }

    public static class Rasp {
        @JsonProperty("код")
        private Long scheduleId;

        @JsonProperty("дисциплина")
        private String discipline;

        @JsonProperty("преподаватель")
        private String teacher;

        @JsonProperty("аудитория")
        private String classroom;

        @JsonProperty("датаНачала")
        private String startDate;

        @JsonProperty("код_Семестра")
        private Long semesterId;

        @JsonProperty("кодГруппы")
        private Long groupId;

        @JsonProperty("кодПреподавателя")
        private Long teacherId;

        @JsonProperty("типНедели")
        private Integer weekType;

        // Геттеры и сеттеры
        public Long getScheduleId() {
            return scheduleId;
        }

        public void setScheduleId(Long scheduleId) {
            this.scheduleId = scheduleId;
        }

        public String getDiscipline() {
            return discipline;
        }

        public void setDiscipline(String discipline) {
            this.discipline = discipline;
        }

        public String getTeacher() {
            return teacher;
        }

        public void setTeacher(String teacher) {
            this.teacher = teacher;
        }

        public String getClassroom() {
            return classroom;
        }

        public void setClassroom(String classroom) {
            this.classroom = classroom;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public Long getSemesterId() {
            return semesterId;
        }

        public void setSemesterId(Long semesterId) {
            this.semesterId = semesterId;
        }

        public Long getGroupId() {
            return groupId;
        }

        public void setGroupId(Long groupId) {
            this.groupId = groupId;
        }

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public Integer getWeekType() {
            return weekType;
        }

        public void setWeekType(Integer weekType) {
            this.weekType = weekType;
        }

    }
}