package com.teducare.dashboard;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    public SuperAdminStatsResponse superAdminStats() {
        return new SuperAdminStatsResponse(27, 5622, 1528600);
    }

    public DashboardStatsResponse institutionStats(String institutionId) {
        if (institutionId == null || institutionId.isBlank()) {
            return new DashboardStatsResponse(48043, 158429, 10238, 1248043);
        }

        return switch (institutionId) {
            case "inst-xyz-college" -> new DashboardStatsResponse(48043, 158429, 10238, 1248043);
            case "inst-ahmadubellouniversit-1" -> new DashboardStatsResponse(22000, 64000, 5300, 540000);
            default -> new DashboardStatsResponse(15000, 47000, 4200, 280000);
        };
    }

    public DashboardEnrollmentResponse enrollment(String range) {
        String normalizedRange = range == null || range.isBlank() ? "day" : range.toLowerCase();

        Map<String, List<EnrollmentPoint>> dataByRange = Map.of(
                "day", List.of(
                        new EnrollmentPoint("6am", 8),
                        new EnrollmentPoint("9am", 22),
                        new EnrollmentPoint("12pm", 18),
                        new EnrollmentPoint("3pm", 26),
                        new EnrollmentPoint("6pm", 14),
                        new EnrollmentPoint("9pm", 6)),
                "week", List.of(
                        new EnrollmentPoint("Mon", 60),
                        new EnrollmentPoint("Tue", 90),
                        new EnrollmentPoint("Wed", 70),
                        new EnrollmentPoint("Thu", 110),
                        new EnrollmentPoint("Fri", 95),
                        new EnrollmentPoint("Sat", 50),
                        new EnrollmentPoint("Sun", 40)),
                "month", List.of(
                        new EnrollmentPoint("Feb", 180),
                        new EnrollmentPoint("Mar", 420),
                        new EnrollmentPoint("Apr", 260),
                        new EnrollmentPoint("May", 400),
                        new EnrollmentPoint("Jun", 220),
                        new EnrollmentPoint("Jul", 340),
                        new EnrollmentPoint("Aug", 200),
                        new EnrollmentPoint("Sep", 260),
                        new EnrollmentPoint("Oct", 360)));

        return new DashboardEnrollmentResponse(dataByRange.getOrDefault(normalizedRange, dataByRange.get("day")));
    }

    public DashboardRecentStudentsResponse recentStudents(int limit) {
        int safeLimit = Math.max(1, limit);
        List<RecentStudent> students = List.of(
                new RecentStudent("std_1", "Amaka Chukwu", "2026-09-23T07:12:00.000Z"),
                new RecentStudent("std_2", "Daniel Okafor", "2026-09-23T06:08:00.000Z"),
                new RecentStudent("std_3", "Fatima Bello", "2026-09-22T21:40:00.000Z"),
                new RecentStudent("std_4", "Michael Adeyemi", "2026-09-22T20:52:00.000Z"));

        return new DashboardRecentStudentsResponse(students.stream().limit(safeLimit).toList());
    }

    public record DashboardStatsResponse(
            long registeredStudents,
            long applicants,
            long lecturers,
            long accumulatedProfit) {
    }

    public record SuperAdminStatsResponse(
            long institutionsCount,
            long totalStudents,
            long totalRevenue) {
    }

    public record DashboardEnrollmentResponse(List<EnrollmentPoint> data) {
    }

    public record EnrollmentPoint(String label, long value) {
    }

    public record DashboardRecentStudentsResponse(List<RecentStudent> data) {
    }

    public record RecentStudent(String id, String name, String registeredAt) {
    }
}
