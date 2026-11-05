package com.teducare.studentportal;

import java.math.BigDecimal;
import java.util.List;

import com.teducare.finance.StudentLedgerLineResponse;

/** {@code status} mirrors FinanceService's own student-bills summary: "PAID" once balance reaches zero, "OWING" otherwise. Derived here from the same ledger lines the admin side's Student Bills ledger view shows this student, never a second source of truth. */
public record StudentBillsResponse(
        BigDecimal totalBilled,
        BigDecimal totalPaid,
        BigDecimal balance,
        String status,
        boolean paystackEnabled,
        List<StudentLedgerLineResponse> ledger) {
}
