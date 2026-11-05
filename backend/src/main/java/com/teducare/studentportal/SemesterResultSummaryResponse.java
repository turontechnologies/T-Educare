package com.teducare.studentportal;

/**
 * One semester's result card on the dashboard's "Results per semester" —
 * {@code cumulativeCgpa} is the running CGPA as of (and including) this
 * semester, in chronological order, not the student's final/current CGPA.
 * {@code isProvisional}/{@code resultsStillToCome} are only meaningful for
 * the institution's current semester — a past semester is always final.
 */
public record SemesterResultSummaryResponse(
        String semesterId,
        String semesterName,
        String sessionLabel,
        Double gpa,
        boolean isProvisional,
        int courseCount,
        int totalUnits,
        Double cumulativeCgpa,
        Integer resultsStillToCome) {
}
