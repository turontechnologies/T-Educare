package com.teducare.leave;

import java.time.Instant;
import java.time.LocalDate;

/** Enriched with staff/leave-type display fields so the frontend never needs a separate lookup to render a row — same convention as DailyAttendanceEntry carrying staffName/staffCode directly. */
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
        Instant resumedAt,
        String resumptionNote,
        Instant createdAt) {
}
