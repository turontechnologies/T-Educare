package com.teducare.courseresult;

import java.math.BigDecimal;
import java.util.List;

/** One student's row in a course's Review grid. {@code overall}/{@code gradeCode}/{@code gradeRemark}/{@code gradePoint} are null until every component has a score for this student. */
public record CourseResultRowResponse(
        String studentId,
        String studentMatricNo,
        String studentName,
        List<ComponentScoreCell> components,
        BigDecimal overall,
        String gradeCode,
        String gradeRemark,
        BigDecimal gradePoint) {
}
