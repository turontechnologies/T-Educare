package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

public record PayslipResponse(
        String id,
        int periodYear,
        int periodMonth,
        String staffName,
        String designationName,
        String departmentName,
        BigDecimal basicPay,
        BigDecimal allowances,
        BigDecimal deductions,
        BigDecimal netPay,
        Instant createdAt) {
}
