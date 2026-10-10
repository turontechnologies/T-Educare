package com.teducare.lecturer;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A recurring weekly slot for a {@link LectureAssignment} — "Mon 10:00-12:00, Room 4". Leaf sub-resource, hard-deleted (no archivedAt), same convention as StaffQualification. */
@Entity
@Table(name = "timetable_slots", schema = "dbo")
public class TimetableSlot {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "lecture_assignment_id", nullable = false, length = 64)
    private String lectureAssignmentId;

    /** "MONDAY".."SUNDAY". */
    @Column(name = "day_of_week", nullable = false, length = 10)
    private String dayOfWeek;

    /** "HH:mm", 24-hour. */
    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime;

    @Column(name = "venue", nullable = false, length = 100)
    private String venue;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TimetableSlot() {
    }

    public TimetableSlot(
            String id,
            String lectureAssignmentId,
            String dayOfWeek,
            String startTime,
            String endTime,
            String venue,
            Instant createdAt) {
        this.id = id;
        this.lectureAssignmentId = lectureAssignmentId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.venue = venue;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getLectureAssignmentId() {
        return lectureAssignmentId;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
