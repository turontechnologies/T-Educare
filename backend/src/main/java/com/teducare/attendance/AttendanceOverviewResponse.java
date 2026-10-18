package com.teducare.attendance;

import java.util.List;

public record AttendanceOverviewResponse(
        String date,
        boolean workday,
        int totalStaff,
        int presentCount,
        int lateCount,
        int absentCount,
        int notClockedInCount,
        int onLeaveCount,
        List<DailyAttendanceEntry> entries) {
}
