package com.teducare.courseresult;

import java.math.BigDecimal;

/** {@code score}/{@code gradeCode} are null if this student isn't registered for this course, or doesn't yet have every component scored. */
public record PerCourseCell(String courseId, BigDecimal score, String gradeCode) {
}
