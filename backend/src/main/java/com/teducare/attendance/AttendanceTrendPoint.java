package com.teducare.attendance;

/** One day's aggregate counts — the Overview's "Attendance Trend" chart data, computed the same way as AttendanceOverviewResponse itself, just for a whole range at once. */
public record AttendanceTrendPoint(
        String date,
        boolean workday,
        int presentCount,
        int lateCount,
        int absentCount,
        int notClockedInCount,
        int onLeaveCount) {

    static AttendanceTrendPoint from(AttendanceOverviewResponse overview) {
        return new AttendanceTrendPoint(
                overview.date(),
                overview.workday(),
                overview.presentCount(),
                overview.lateCount(),
                overview.absentCount(),
                overview.notClockedInCount(),
                overview.onLeaveCount());
    }
}
