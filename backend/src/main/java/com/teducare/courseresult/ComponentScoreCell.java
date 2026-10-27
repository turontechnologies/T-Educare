package com.teducare.courseresult;

import java.math.BigDecimal;

/** {@code score} is null when this student hasn't had this component recorded yet. */
public record ComponentScoreCell(String componentId, String componentName, BigDecimal weight, BigDecimal score) {
}
