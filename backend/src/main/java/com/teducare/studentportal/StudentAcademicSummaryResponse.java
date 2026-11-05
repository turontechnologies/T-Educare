package com.teducare.studentportal;

import java.util.List;

/**
 * {@code cgpa} is null (not zero) when the student has no scored results
 * yet — same "no data" vs. "a real 0.00" distinction as CourseResultService's
 * own CgpaResponse. {@code cgpaClassification} is the standard 5.0-scale
 * Nigerian university band for {@code cgpa} (null when {@code cgpa} is
 * null) — see {@code StudentPortalService#classify}. {@code currentSemesterId}
 * is null when the institution hasn't marked a current semester yet, in
 * which case {@code registeredCourses} is always empty.
 */
public record StudentAcademicSummaryResponse(
        String departmentName,
        String levelCode,
        String sessionLabel,
        Double cgpa,
        String cgpaClassification,
        String currentSemesterId,
        String currentSemesterName,
        List<RegisteredCourseResponse> registeredCourses,
        int registeredUnits,
        List<SemesterResultSummaryResponse> resultsBySemester) {
}
