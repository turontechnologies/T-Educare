package com.teducare.courseresult;

import java.util.List;

/** {@code overallPercent} is the plain arithmetic mean of this student's per-course Overall scores across the group's courses (not unit-weighted — that's what GPA is for); null until the student has a complete Overall for at least one course. */
public record DepartmentStudentRow(
        String studentId,
        String studentMatricNo,
        String studentName,
        List<PerCourseCell> perCourse,
        Double overallPercent,
        String overallGradeCode,
        Double gpa,
        Double cgpa) {
}
