package com.teducare.leave;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.teducare.staff.StaffMemberResponse;

/** Minimal CSV read/write for leave request import/export — same quoting convention as StaffCsv/CourseCsv. {@code leaveType} is matched by name (not the opaque leaveTypeId) so a human filling the sheet doesn't need to know internal IDs; {@code staffId} accepts either the staff member's own business code or the internal ID, same as everywhere else staff are referenced by a caller-supplied string. */
final class LeaveCsv {

    private LeaveCsv() {
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

    static String write(
            List<LeaveRequest> requests,
            Map<String, StaffMemberResponse> staffById,
            Map<String, String> leaveTypeNameById) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(List.of(
                "staffId", "staffName", "leaveType", "startDate", "endDate", "totalDays", "reason", "status",
                "createdAt")));
        for (LeaveRequest r : requests) {
            StaffMemberResponse staff = staffById.get(r.getStaffId());
            sb.append(csvLine(List.of(
                    staff == null ? "" : staff.staffId(),
                    staff == null ? "" : staff.firstName() + " " + staff.lastName(),
                    leaveTypeNameById.getOrDefault(r.getLeaveTypeId(), "—"),
                    String.valueOf(r.getStartDate()),
                    String.valueOf(r.getEndDate()),
                    String.valueOf(r.getTotalDays()),
                    r.getReason(),
                    r.getStatus(),
                    String.valueOf(r.getCreatedAt()))));
        }
        return sb.toString();
    }

    /** Header + one real, currently-valid example row — guaranteed importable as-is, so staff can also just duplicate it and edit the dates/reason rather than guess the format. */
    static String template(StaffMemberResponse exampleStaff, LeaveType exampleType) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(List.of("staffId", "leaveType", "startDate", "endDate", "reason", "status")));
        sb.append(csvLine(List.of(
                exampleStaff == null ? "SU-ST-1001" : exampleStaff.staffId(),
                exampleType == null ? "Annual Leave" : exampleType.getName(),
                "2026-01-06",
                "2026-01-10",
                "Family event",
                "PENDING")));
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
