package com.teducare.courseresult;

import java.util.List;

/** The "View Result" drill-in for one (department, level) group — every course in the group as a matrix column, every student registered in any of them as a row. */
public record DepartmentGroupDetailResponse(
        String departmentName,
        String schoolName,
        String levelCode,
        int totalCourses,
        int submittedCourses,
        String status,
        String academicSemesterId,
        List<DepartmentCourseColumn> courses,
        List<DepartmentStudentRow> students) {
}
