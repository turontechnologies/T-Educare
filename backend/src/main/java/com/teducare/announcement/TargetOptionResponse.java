package com.teducare.announcement;

/** One selectable value for the Create Announcement dialog's "Target" field, dependent on the chosen {@code targetScope} — see {@code AnnouncementService.targetOptions}. */
public record TargetOptionResponse(String value, String label) {
}
