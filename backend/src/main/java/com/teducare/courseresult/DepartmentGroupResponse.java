package com.teducare.courseresult;

/** One row of the admin "Programs" tab — one (department, program level) group that has at least one real course this semester. {@code status} is "PENDING_COMPLETION" (not every course submitted yet), "AWAITING_PUBLISHING" (every course submitted, not every one published), or "PUBLISHED" (every course published). */
public record DepartmentGroupResponse(
        String departmentId,
        String departmentName,
        String schoolName,
        String programLevelId,
        String levelCode,
        int totalCourses,
        int submittedCourses,
        String status,
        String academicSemesterId) {
}
