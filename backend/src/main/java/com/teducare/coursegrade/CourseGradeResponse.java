package com.teducare.coursegrade;

import java.math.BigDecimal;
import java.time.Instant;

public record CourseGradeResponse(
        String id,
        String institutionId,
        String code,
        String remark,
        BigDecimal gradeScore,
        BigDecimal minimumScore,
        BigDecimal maximumScore,
        Instant createdAt,
        Instant archivedAt) {

    static CourseGradeResponse from(CourseGrade courseGrade) {
        return new CourseGradeResponse(
                courseGrade.getId(),
                courseGrade.getInstitutionId(),
                courseGrade.getCode(),
                courseGrade.getRemark(),
                courseGrade.getGradeScore(),
                courseGrade.getMinimumScore(),
                courseGrade.getMaximumScore(),
                courseGrade.getCreatedAt(),
                courseGrade.getArchivedAt());
    }
}
