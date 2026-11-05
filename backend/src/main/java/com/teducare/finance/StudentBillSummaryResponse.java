package com.teducare.finance;

import java.math.BigDecimal;

public record StudentBillSummaryResponse(
        String studentId,
        String matricNo,
        String studentName,
        String departmentName,
        BigDecimal totalBilled,
        BigDecimal totalPaid,
        BigDecimal balance,
        String status) {
}
