package com.teducare.studentportal;

import java.util.List;

/** {@code cgpa} is null (not zero) when the student has no scored results yet — same "no data" vs. "a real 0.00" distinction as CourseResultService's own CgpaResponse. {@code currentSemesterId} is null when the institution hasn't marked a current semester yet, in which case {@code registeredCourses} is always empty. */
public record StudentAcademicSummaryResponse(
        Double cgpa,
        String currentSemesterId,
        String currentSemesterName,
        List<RegisteredCourseResponse> registeredCourses,
        int registeredUnits) {
}
