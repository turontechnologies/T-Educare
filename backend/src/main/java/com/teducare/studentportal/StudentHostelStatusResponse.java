package com.teducare.studentportal;

/** Reads the same cached "which hostel/room" summary on {@code Student} that the admin side's Hostel Allocations module keeps up to date — see {@code StudentService#assignHostel}'s doc comment. Both fields null when not currently allocated. */
public record StudentHostelStatusResponse(String hostelName, String roomNumber) {
}
