package com.teducare.attendance;

import java.time.Instant;

/**
 * One staff member's derived attendance for one calendar day — never
 * persisted, always computed from {@link AttendanceEvent}s + {@link
 * AttendanceSettings} at read time. {@code status} is one of "PRESENT"
 * (clocked in within the grace period), "LATE" (clocked in after it),
 * "ABSENT" (a past workday with no clock-in at all), "NOT_CLOCKED_IN"
 * (today, a workday, not yet arrived), or "NON_WORKDAY".
 */
public record DailyAttendanceEntry(
        String staffId,
        String staffCode,
        String staffName,
        String status,
        Instant clockInAt,
        Instant clockOutAt) {
}
