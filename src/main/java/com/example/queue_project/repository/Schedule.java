package com.example.queue_project.repository;

import java.sql.Timestamp;

public class Schedule {
    private Long scheduleId;     // bigint unsigned
    private Long subjectId;      // bigint unsigned
    private Long groupId;        // bigint unsigned
    private Long teacherId;      // bigint unsigned
    private String classroom;    // varchar(50)
    private Timestamp dateTime;  // timestamp
    private String classType;    // varchar(50)

    public Schedule() {
    }

    // Parameterized constructor
    public Schedule(Long scheduleId, Long subjectId, Long groupId, Long teacherId,
                    String classroom, Timestamp dateTime, String classType) {
        this.scheduleId = scheduleId;
        this.subjectId = subjectId;
        this.groupId = groupId;
        this.teacherId = teacherId;
        this.classroom = classroom;
        this.dateTime = dateTime;
        this.classType = classType;
    }

    // Getters and Setters
    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
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

    public String getClassroom() {
        return classroom;
    }

    public void setClassroom(String classroom) {
        this.classroom = classroom;
    }

    public Timestamp getDateTime() {
        return dateTime;
    }

    public void setDateTime(Timestamp dateTime) {
        this.dateTime = dateTime;
    }

    public String getClassType() {
        return classType;
    }

    public void setClassType(String classType) {
        this.classType = classType;
    }

//    @Override
//    public String toString() {
//        return "Schedule{" +
//                "scheduleId=" + scheduleId +
//                ", subjectId=" + subjectId +
//                ", groupId=" + groupId +
//                ", teacherId=" + teacherId +
//                ", classroom='" + classroom + '\'' +
//                ", dateTime=" + dateTime +
//                ", classType='" + classType + '\'' +
//                '}';
//    }
}
