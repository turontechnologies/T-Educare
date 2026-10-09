package com.teducare.course;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Minimal CSV read/write for course import/export (API_CONTRACT.md
 * §7.10) — handles quoted fields with embedded commas/escaped quotes
 * (`""`), matching the same quoting convention the frontend's own CSV
 * export already uses elsewhere in this app.
 */
final class CourseCsv {

    private CourseCsv() {
    }

    /** Parses a CSV document into rows keyed by lower-cased, trimmed header names. */
    static List<Map<String, String>> parse(String text) {
        List<String> lines = splitLines(text);
        if (lines.isEmpty()) {
            return List.of();
        }

        List<String> header = parseLine(lines.get(0)).stream()
                .map(cell -> cell.trim().toLowerCase(Locale.ROOT))
                .toList();

        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            if (lines.get(i).isBlank()) {
                continue;
            }
            List<String> cells = parseLine(lines.get(i));
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < header.size(); c++) {
                row.put(header.get(c), c < cells.size() ? cells.get(c) : "");
            }
            rows.add(row);
        }
        return rows;
    }

    static String write(List<Course> courses) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(List.of(
                "id", "name", "code", "departmentId", "schoolId", "programLevelId", "unit", "createdAt", "archivedAt")));
        for (Course course : courses) {
            sb.append(csvLine(List.of(
                    course.getId(),
                    course.getName(),
                    course.getCode(),
                    course.getDepartmentId(),
                    course.getSchoolId(),
                    course.getProgramLevelId(),
                    String.valueOf(course.getUnit()),
                    String.valueOf(course.getCreatedAt()),
                    course.getArchivedAt() == null ? "" : String.valueOf(course.getArchivedAt()))));
        }
        return sb.toString();
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
