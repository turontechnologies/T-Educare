package com.teducare.hostel;

import java.time.Instant;

/** Enriched so the frontend never needs a separate lookup to render a row — same convention as every other list response in this backend (DailyAttendanceEntry, LeaveRequestResponse, CourseResultResponse). {@code hostelId}/{@code hostelName}/{@code roomId}/{@code roomNumber} are null while WAITLIST. */
public record HostelAllocationResponse(
        String id,
        String studentId,
        String studentMatricNo,
        String studentName,
        String departmentName,
        String hostelId,
        String hostelName,
        String roomId,
        String roomNumber,
        String status,
        Instant createdAt) {
}
