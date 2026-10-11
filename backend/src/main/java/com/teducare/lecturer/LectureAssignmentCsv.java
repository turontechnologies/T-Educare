package com.teducare.lecturer;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Flat CSV read/write for the timetable — one row per (lecturer, course,
 * session, day, time, venue), the same grain a spreadsheet-minded admin
 * actually works in, not one row per {@link LectureAssignment} with nested
 * slots. Same quoting convention as LecturerCsv/StaffCsv/CourseCsv.
 */
final class LectureAssignmentCsv {

    private LectureAssignmentCsv() {
    }

    record Row(
            String lecturerUsername,
            String courseCode,
            String academicSession,
            String dayOfWeek,
            String startTime,
            String endTime,
            String venue) {
    }

    static List<Row> parse(String text) {
        List<String> lines = splitLines(text);
        if (lines.isEmpty()) {
            return List.of();
        }

        List<String> header = parseLine(lines.get(0)).stream()
                .map(cell -> cell.trim().toLowerCase(Locale.ROOT))
                .toList();

        List<Row> rows = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            if (lines.get(i).isBlank()) {
                continue;
            }
            List<String> cells = parseLine(lines.get(i));
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < header.size(); c++) {
                row.put(header.get(c), c < cells.size() ? cells.get(c) : "");
            }
            rows.add(new Row(
                    row.getOrDefault("lecturerusername", "").trim(),
                    row.getOrDefault("coursecode", "").trim(),
                    row.getOrDefault("academicsession", "").trim(),
                    row.getOrDefault("dayofweek", "").trim(),
                    row.getOrDefault("starttime", "").trim(),
                    row.getOrDefault("endtime", "").trim(),
                    row.getOrDefault("venue", "").trim()));
        }
        return rows;
    }

    static String write(List<TimetableExportRow> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(List.of(
                "lecturerUsername", "lecturerName", "courseCode", "courseName", "programLevel", "department",
                "academicSession", "dayOfWeek", "startTime", "endTime", "venue")));
        for (TimetableExportRow r : rows) {
            sb.append(csvLine(List.of(
                    r.lecturerUsername(),
                    r.lecturerName(),
                    r.courseCode(),
                    r.courseName(),
                    r.programLevel(),
                    r.department(),
                    r.academicSession(),
                    r.dayOfWeek(),
                    r.startTime(),
                    r.endTime(),
                    r.venue())));
        }
        return sb.toString();
    }

    record TimetableExportRow(
            String lecturerUsername,
            String lecturerName,
            String courseCode,
            String courseName,
            String programLevel,
            String department,
            String academicSession,
            String dayOfWeek,
            String startTime,
            String endTime,
            String venue) {
    }

    private static List<String> splitLines(String text) {
        List<String> lines = new ArrayList<>();
        for (String line : text.split("\r\n|\r|\n")) {
            lines.add(line);
        }
        while (!lines.isEmpty() && lines.get(lines.size() - 1).isBlank()) {
            lines.remove(lines.size() - 1);
        }
        return lines;
    }

    private static List<String> parseLine(String line) {
        List<String> cells = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(ch);
                }
            } else if (ch == '"') {
                inQuotes = true;
            } else if (ch == ',') {
                cells.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        cells.add(current.toString());
        return cells;
    }

    private static String csvLine(List<String> cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append('"').append(cells.get(i).replace("\"", "\"\"")).append('"');
        }
        sb.append('\n');
        return sb.toString();
    }
}
