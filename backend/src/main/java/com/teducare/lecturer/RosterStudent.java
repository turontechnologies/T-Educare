package com.teducare.lecturer;

/** Deliberately minimal — a lecturer's course roster shows only the matric number and photo, by explicit request, not the full student record a registrar sees. */
public record RosterStudent(String studentId, String matricNo, String avatarUrl) {
}
