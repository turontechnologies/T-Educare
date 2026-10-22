package com.teducare.lecturer;

import java.util.List;

/** One of a lecturer's own courses, for the current semester, with the students registered for it. */
public record LecturerCourseRoster(
        String courseId, String courseCode, String courseName, List<RosterStudent> students) {
}
