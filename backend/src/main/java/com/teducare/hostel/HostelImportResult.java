package com.teducare.hostel;

/** {@code imported} counts hostels created, not rooms — same `{ imported, skipped }` shape as the documented `/courses/import` (API_CONTRACT.md §7.10). */
public record HostelImportResult(int imported, int skipped) {
}
