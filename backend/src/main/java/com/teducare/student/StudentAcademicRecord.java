package com.teducare.student;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One session's worth of a student's academic standing — append-only,
 * never edited or removed, mirroring the exact "cached current value +
 * append-only immutable history" shape used throughout this backend
 * (institution license events, etc.) and matching the pre-backend mock's
 * own `Student.academicHistory` shape. {@code carryoverCourseIds} is
 * stored comma-separated (same convention as {@code Institution.moduleKeys})
 * — real Course ids, not free-text course codes like the mock used, now
 * that Courses are a real resource. Per-course scores/grades
 * (the mock's {@code CourseResult}) are deliberately NOT modeled here —
 * that's Results Management, a separate, not-yet-built module; this
 * table only tracks level-per-session history and outstanding carryovers,
 * which is what the course-registration carryover rule actually needs.
 */
@Entity
@Table(name = "student_academic_records", schema = "dbo")
public class StudentAcademicRecord {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "academic_session_id", nullable = false, length = 64)
    private String academicSessionId;

    @Column(name = "program_level_id", nullable = false, length = 64)
    private String programLevelId;

    /** "completed" | "current" | "repeat". */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    /** Comma-separated Course ids still outstanding as of the end of this record — empty/null means none. */
    @Column(name = "carryover_course_ids", length = 1000)
    private String carryoverCourseIds;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StudentAcademicRecord() {
    }

    public StudentAcademicRecord(
            String id,
            String studentId,
            String academicSessionId,
            String programLevelId,
            String status,
            String carryoverCourseIds,
            Instant createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.academicSessionId = academicSessionId;
        this.programLevelId = programLevelId;
        this.status = status;
        this.carryoverCourseIds = carryoverCourseIds;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getAcademicSessionId() {
        return academicSessionId;
    }

    public String getProgramLevelId() {
        return programLevelId;
    }

    public String getStatus() {
        return status;
    }

    public String getCarryoverCourseIds() {
        return carryoverCourseIds;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
