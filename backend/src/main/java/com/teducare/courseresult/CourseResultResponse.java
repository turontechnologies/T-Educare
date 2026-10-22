package com.teducare.courseresult;

import java.math.BigDecimal;
import java.time.Instant;

/** Enriched so the frontend never needs a separate lookup to render a row — same convention as DailyAttendanceEntry/LeaveRequestResponse. {@code gradeCode}/{@code gradeRemark}/{@code gradePoint} are null if the score doesn't fall within any configured grade band. */
public record CourseResultResponse(
        String id,
        String studentId,
        String studentMatricNo,
        String studentName,
        String courseId,
        String courseCode,
        String courseName,
        int courseUnit,
        String academicSemesterId,
        BigDecimal score,
        String gradeCode,
        String gradeRemark,
        BigDecimal gradePoint,
        Instant createdAt,
        Instant updatedAt) {
}
