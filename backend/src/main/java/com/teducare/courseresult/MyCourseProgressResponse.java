package com.teducare.courseresult;

import java.util.List;

/** A lecturer's own score-entry page for one course — {@code canSubmit} is true only once every component shows RECORDED for every registered student (the gate on "Review & Submit results"). {@code deadlineLabel} is a plain display string ("Deadline in 15 days") computed from {@link ResultsGracePeriod}, null if no deadline is set. */
public record MyCourseProgressResponse(
        String courseId,
        String courseCode,
        String courseName,
        String departmentName,
        String schoolName,
        String levelCode,
        String status,
        String deadlineLabel,
        int totalStudents,
        String academicSemesterId,
        List<ComponentProgressResponse> components,
        boolean canSubmit) {
}
