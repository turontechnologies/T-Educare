package com.teducare.courseresult;

import java.math.BigDecimal;

/** {@code score} is null when this student hasn't been recorded for this component yet. */
public record StudentScoreCell(String studentId, String matricNo, String studentName, BigDecimal score) {
}
