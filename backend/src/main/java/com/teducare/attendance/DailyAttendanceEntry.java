package com.teducare.attendance;

import java.time.Instant;

/**
 * One staff member's derived attendance for one calendar day — never
 * persisted, always computed from {@link AttendanceEvent}s + {@link
 * AttendanceSettings} at read time. {@code status} is one of "PRESENT"
 * (clocked in within the grace period), "LATE" (clocked in after it),
 * "ABSENT" (a past workday with no clock-in at all), "NOT_CLOCKED_IN"
 * (today, a workday, not yet arrived), "ON_LEAVE" (an APPROVED leave
 * request from {@code com.teducare.leave} covers this day — checked and
 * takes priority over every other status, including on a non-workday),
 * or "NON_WORKDAY". {@code leaveTypeName} is only present when {@code
 * status} is "ON_LEAVE".
 */
public record DailyAttendanceEntry(
        String staffId,
        String staffCode,
        String staffName,
        String status,
        Instant clockInAt,
        Instant clockOutAt,
        String leaveTypeName) {
}
