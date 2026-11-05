package com.teducare.finance;

import java.math.BigDecimal;

/** {@code status}: {@code ON_HOLD} (excluded from the next run), {@code PENDING} (not yet run for the requested period — amounts are a live projection from the current salary/profile), or {@code PAID} (a real {@link Payslip} exists for that period — amounts are its frozen snapshot). */
public record PayrollRowResponse(
        String staffId,
        String staffCode,
        String staffName,
        String designationName,
        String departmentName,
        BigDecimal basicPay,
        BigDecimal allowances,
        BigDecimal deductions,
        BigDecimal netPay,
        boolean onHold,
        String onHoldReason,
        String status) {
}
