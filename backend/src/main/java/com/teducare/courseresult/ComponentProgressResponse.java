package com.teducare.courseresult;

import java.math.BigDecimal;

/** {@code status} is "NOT_STARTED" (0 scored), "IN_PROGRESS" (some scored), or "RECORDED" (every registered student scored) — the three-card view on a lecturer's score-entry page. */
public record ComponentProgressResponse(
        String componentId, String componentName, BigDecimal weight, int scoredStudents, int totalStudents, String status) {
}
