package com.teducare.course;

/**
 * Any field left null keeps its current value — same partial-update
 * convention as program/UpdateProgramRequest. `unit` uses the boxed
 * `Integer` for the same reason. `lecturerId` is the one exception:
 * since "no lecturer assigned" is itself a meaningful state, a
 * non-null-but-blank value explicitly clears it rather than meaning
 * "no change" (see CourseService.update).
 */
public record UpdateCourseRequest(
        String name,
        String code,
        String departmentId,
        String schoolId,
        String programLevelId,
        Integer unit,
        Integer semesterNumber,
        String lecturerId) {
}
