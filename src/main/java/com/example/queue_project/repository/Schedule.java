package com.example.queue_project.repository;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.util.Objects;

@Entity
@Table(name = "schedule")
public class Schedule {
    @Id
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "subject")
    private String subject;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "teacher")
    private String teacher;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "schedule_data")
    private Timestamp scheduleData; // Если это JSON или дополнительная информация

    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "teacher_id")
    private Long teacherId;

    // Конструкторы
    public Schedule() {
        // Пустой конструктор требуется для JPA
    }

    public Schedule(Long scheduleId, Long subjectId, Long groupId,
                    Long teacherId, String roomNumber, Timestamp scheduleData) {
        this.scheduleId = scheduleId;
        this.subjectId = subjectId;
        this.groupId = groupId;
        this.teacherId = teacherId;
        this.roomNumber = roomNumber;
        this.scheduleData = scheduleData;
    }

    // Геттеры и сеттеры
    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getTeacher() {
        return teacher;
    }

    public void setTeacher(String teacher) {
        this.teacher = teacher;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }


    public Timestamp getScheduleData() {
        return scheduleData;
    }

    public void setScheduleData(Timestamp scheduleData) {
        this.scheduleData = scheduleData;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    // equals и hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Schedule schedule = (Schedule) o;
        return Objects.equals(scheduleId, schedule.scheduleId) &&
                Objects.equals(subject, schedule.subject) &&
                Objects.equals(groupId, schedule.groupId) &&
                Objects.equals(teacher, schedule.teacher) &&
                Objects.equals(roomNumber, schedule.roomNumber) &&
                Objects.equals(subjectId, schedule.subjectId) &&
                Objects.equals(teacherId, schedule.teacherId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(scheduleId, subject, groupId, teacher,
                roomNumber, subjectId, teacherId);
    }

    // toString
    @Override
    public String toString() {
        return "Schedule{" +
                "scheduleId=" + scheduleId +
                ", subject='" + subject + '\'' +
                ", groupId=" + groupId +
                ", teacher='" + teacher + '\'' +
                ", roomNumber='" + roomNumber + '\'' +
                ", scheduleDate="  +
                ", subjectId=" + subjectId +
                ", teacherId=" + teacherId +
                '}';
    }
}