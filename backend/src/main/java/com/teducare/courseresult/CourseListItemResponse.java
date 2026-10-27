package com.teducare.courseresult;

/**
 * One row of {@code GET /course-results/courses} — shared by the admin
 * "Courses" tab and a lecturer's scoped "My Courses" tab; the raw {@code
 * status} (IN_PROGRESS/SUBMITTED/PUBLISHED) plus {@code scoredStudents}/
 * {@code totalStudents} is everything either view needs to derive its own
 * display label (Not Started/In Progress/Awaiting Submission for a
 * teacher; Pending Completion/Awaiting Publishing for an admin) — computed
 * client-side rather than duplicated as two separate stored label fields.
 */
public record CourseListItemResponse(
        String courseId,
        String courseCode,
        String courseName,
        String departmentName,
        String schoolName,
        String lecturerName,
        int totalStudents,
        int scoredStudents,
        String status,
        String academicSemesterId) {
}
