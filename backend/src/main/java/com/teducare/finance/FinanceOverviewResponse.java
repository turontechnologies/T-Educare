package com.teducare.finance;

import java.math.BigDecimal;
import java.util.List;

public record FinanceOverviewResponse(
        BigDecimal totalRevenue,
        BigDecimal totalOutstanding,
        BigDecimal payrollDueThisMonth,
        double feeCollectionRate,
        List<AgeBucket> outstandingByAge,
        List<StudentBillSummaryResponse> topDebtors,
        List<RevenuePoint> revenueTrend) {

    public record AgeBucket(String label, BigDecimal amount, int studentCount) {
    }

    public record RevenuePoint(String weekLabel, BigDecimal amount) {
    }
}
