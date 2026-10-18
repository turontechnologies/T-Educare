package com.teducare.leave;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Enriched with staff/leave-type display fields so the frontend never needs
 * a separate lookup to render a row — same convention as DailyAttendanceEntry
 * carrying staffName/staffCode directly. {@code isAutoExtending}/{@code
 * daysRestored} are computed by {@link LeaveRequestService}, never stored —
 * see {@code LeaveRequest}'s own doc comment for the resumption rules they
 * reflect.
 */
public record LeaveRequestResponse(
        String id,
        String staffId,
        String staffCode,
        String staffName,
        String leaveTypeId,
        String leaveTypeName,
        LocalDate startDate,
        LocalDate endDate,
        int totalDays,
        String reason,
        String status,
        String reviewedBy,
        Instant reviewedAt,
        String reviewNote,
        LocalDate resumptionDate,
        Instant resumptionReportedAt,
        String resumptionNote,
        String resumptionLateReason,
        String resumptionStatus,
        String resumptionReviewedBy,
        Instant resumptionReviewedAt,
        String resumptionReviewNote,
        /** True when this request is APPROVED, has no APPROVED resumption yet, and today is already past endDate — i.e. the system is live-extending it and deducting extra days right now. */
        boolean isAutoExtending,
        /** Only meaningful once resumptionStatus is "APPROVED": positive = days credited back (early return), negative = extra days deducted (confirmed overstay). */
        Integer daysRestored,
        Instant createdAt) {
}
