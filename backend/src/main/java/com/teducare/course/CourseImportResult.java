package com.teducare.course;

/** Same `{ imported, skipped }` shape as the documented `/students/import` (API_CONTRACT.md §7.2, §7.10). */
public record CourseImportResult(int imported, int skipped) {
}
