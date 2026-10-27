package com.teducare.courseresult;

import java.math.BigDecimal;
import java.util.List;

/** The "Record {Component} Scores" dialog's prefill — every student registered for the course this semester, with their current score for this one component if already recorded. */
public record ComponentScoresResponse(
        String componentId, String componentName, BigDecimal weight, List<StudentScoreCell> students) {
}
