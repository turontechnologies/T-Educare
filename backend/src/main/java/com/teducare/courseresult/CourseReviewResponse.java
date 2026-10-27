package com.teducare.courseresult;

import java.util.List;

/** The full student x component grid for one course + semester — backs both the admin "Review" page and a teacher's read-only "View results". */
public record CourseReviewResponse(
        String courseId,
        String courseCode,
        String courseName,
        String departmentName,
        String schoolName,
        String levelCode,
        String status,
        int totalStudents,
        int scoredStudents,
        String academicSemesterId,
        List<MarkingGuideComponentResponse> components,
        List<CourseResultRowResponse> students) {
}
