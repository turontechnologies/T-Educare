package com.teducare.attendance;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.teducare.staff.StaffMemberResponse;

/** Minimal CSV read/write for clock-event import/export — same quoting convention as StaffCsv/LeaveCsv. Only manual entries round-trip through this; a device's own events are append-only from the device itself and never meant to be bulk-edited. */
final class AttendanceCsv {

    private AttendanceCsv() {
    }

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

    static final List<String> HEADERS =
            List.of("staffId", "staffName", "eventType", "occurredAt", "source", "note");

    /** Same cell values {@link #write} puts in a CSV line, as a plain list-of-lists — the shape {@link com.teducare.export.TabularExport} needs for XLSX/PDF. */
    static List<List<String>> rows(List<AttendanceEvent> events, Map<String, StaffMemberResponse> staffById) {
        List<List<String>> rows = new ArrayList<>();
        for (AttendanceEvent e : events) {
            StaffMemberResponse staff = staffById.get(e.getStaffId());
            rows.add(List.of(
                    staff == null ? "" : staff.staffId(),
                    staff == null ? "" : staff.firstName() + " " + staff.lastName(),
                    e.getEventType(),
                    String.valueOf(e.getOccurredAt()),
                    e.getSource(),
                    e.getNote() == null ? "" : e.getNote()));
        }
        return rows;
    }

    static String write(List<AttendanceEvent> events, Map<String, StaffMemberResponse> staffById) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(HEADERS));
        for (List<String> row : rows(events, staffById)) {
            sb.append(csvLine(row));
        }
        return sb.toString();
    }

    /** Header + one real, currently-valid example row — every imported row becomes a MANUAL event regardless of what's in a "source" column, so that column isn't part of the input shape. */
    static String template(StaffMemberResponse exampleStaff) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(List.of("staffId", "eventType", "occurredAt", "note")));
        sb.append(csvLine(List.of(
                exampleStaff == null ? "SU-ST-1001" : exampleStaff.staffId(),
                "CLOCK_IN",
                "2026-01-06T08:00:00Z",
                "Backfilled from manual register")));
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
