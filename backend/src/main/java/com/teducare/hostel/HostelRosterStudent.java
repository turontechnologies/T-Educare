package com.teducare.hostel;

/** One ALLOCATED occupant of a hostel — the "View Student List" dialog's row shape. */
public record HostelRosterStudent(
        String studentId, String matricNo, String studentName, String departmentName, String roomNumber) {
}
