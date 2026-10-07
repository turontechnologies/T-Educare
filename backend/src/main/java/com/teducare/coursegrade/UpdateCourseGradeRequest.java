package com.teducare.coursegrade;

import java.math.BigDecimal;

/** Any field left null keeps its current value — same partial-update convention as programlevel/UpdateProgramLevelRequest. */
public record UpdateCourseGradeRequest(
        String code, String remark, BigDecimal gradeScore, BigDecimal minimumScore, BigDecimal maximumScore) {
}
