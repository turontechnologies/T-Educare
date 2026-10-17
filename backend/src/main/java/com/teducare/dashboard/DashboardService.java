package com.teducare.dashboard;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.teducare.institution.InstitutionRepository;
import com.teducare.lecturer.LecturerRepository;
import com.teducare.student.Student;
import com.teducare.student.StudentRepository;

@Service
public class DashboardService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("d MMM");
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");

    private final InstitutionRepository institutionRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

    public DashboardService(
            InstitutionRepository institutionRepository,
            StudentRepository studentRepository,
            LecturerRepository lecturerRepository) {
        this.institutionRepository = institutionRepository;
        this.studentRepository = studentRepository;
        this.lecturerRepository = lecturerRepository;
    }

    /**
     * Real, platform-wide aggregates — never hardcoded. {@code totalStudents}
     * is a live count off the real {@code students} table, not a sum of
     * {@code Institution.studentCount} (that column is set to 0 at creation
     * and never updated by any real write path since — confirmed nothing
     * outside the constructor ever calls {@code setStudentCount}, so summing
     * it always returned 0 regardless of how many real students existed).
     * {@code totalRevenue} stays honestly 0: no Financials/Payment resource
     * exists yet to sum (same reasoning as {@code Institution.revenue}, also
     * dead for the same reason).
     */
    public SuperAdminStatsResponse superAdminStats() {
        return new SuperAdminStatsResponse(
                institutionRepository.countActive(),
                studentRepository.countByArchivedAtIsNull(),
                0L);
    }

    /**
     * {@code registeredStudents}/{@code lecturers} are real, live,
     * institution-scoped counts off the {@code students}/{@code lecturers}
     * tables — replacing a prior version that read {@code Institution}'s own
     * {@code studentCount}/{@code revenue} columns, which never reflected
     * real data (see {@link #superAdminStats()}'s doc comment). {@code
     * applicants}/{@code accumulatedProfit} stay honestly 0 — no
     * Applicant-tracking or Financials/Payment resource exists yet; a
     * pre-matriculation "pre-student" is still a real {@code Student} row
     * (see {@code Student}'s own doc comment), so there is no separate
     * applicant concept to count.
     */
    public DashboardStatsResponse institutionStats(String institutionId) {
        if (institutionId == null || institutionId.isBlank()) {
            return new DashboardStatsResponse(0, 0, 0, 0);
        }

        long registeredStudents = studentRepository.countByInstitutionIdAndArchivedAtIsNull(institutionId);
        long lecturers = lecturerRepository.countByInstitutionIdAndArchivedAtIsNull(institutionId);
        return new DashboardStatsResponse(registeredStudents, 0, lecturers, 0);
    }

    /**
     * Real, institution-scoped registration counts bucketed by the
     * requested range, computed at read time off {@code Student.createdAt}
     * — never persisted/cached, same "compute from raw records" convention
     * as Time & Attendance's daily status. Buckets with no registrations
     * still appear, at 0, so the chart's x-axis is always a complete,
     * evenly-spaced window rather than skipping quiet periods.
     */
    public DashboardEnrollmentResponse enrollment(String institutionId, String range) {
        if (institutionId == null || institutionId.isBlank()) {
            return new DashboardEnrollmentResponse(List.of());
        }

        List<Student> students =
                studentRepository.findByInstitutionIdAndArchivedAtIsNullOrderByCreatedAtDesc(institutionId);

        return switch (range == null ? "day" : range) {
            case "week" -> new DashboardEnrollmentResponse(bucketByWeek(students));
            case "month" -> new DashboardEnrollmentResponse(bucketByMonth(students));
            default -> new DashboardEnrollmentResponse(bucketByDay(students));
        };
    }

    private List<EnrollmentPoint> bucketByDay(List<Student> students) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) {
            counts.put(today.minusDays(i), 0L);
        }
        for (Student student : students) {
            LocalDate day = createdAtDate(student);
            counts.computeIfPresent(day, (key, value) -> value + 1);
        }
        return toPoints(counts, DAY_LABEL);
    }

    private List<EnrollmentPoint> bucketByWeek(List<Student> students) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate thisWeekStart = today.minusDays(today.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 7; i >= 0; i--) {
            counts.put(thisWeekStart.minusWeeks(i), 0L);
        }
        for (Student student : students) {
            LocalDate created = createdAtDate(student);
            LocalDate weekStart =
                    created.minusDays(created.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
            counts.computeIfPresent(weekStart, (key, value) -> value + 1);
        }
        List<EnrollmentPoint> points = new ArrayList<>();
        counts.forEach((weekStart, count) -> points.add(new EnrollmentPoint("Wk of " + weekStart.format(DAY_LABEL), count)));
        return points;
    }

    private List<EnrollmentPoint> bucketByMonth(List<Student> students) {
        LocalDate thisMonth = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1);
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            counts.put(thisMonth.minusMonths(i), 0L);
        }
        for (Student student : students) {
            LocalDate month = createdAtDate(student).withDayOfMonth(1);
            counts.computeIfPresent(month, (key, value) -> value + 1);
        }
        return toPoints(counts, MONTH_LABEL);
    }

    private static LocalDate createdAtDate(Student student) {
        return student.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
    }

    private static List<EnrollmentPoint> toPoints(Map<LocalDate, Long> counts, DateTimeFormatter formatter) {
        List<EnrollmentPoint> points = new ArrayList<>();
        counts.forEach((date, count) -> points.add(new EnrollmentPoint(date.format(formatter), count)));
        return points;
    }

    /** Real, institution-scoped recent students, newest first — replacing a prior version that was always empty (no real Students resource existed when it was written). */
    public DashboardRecentStudentsResponse recentStudents(String institutionId, int limit) {
        if (institutionId == null || institutionId.isBlank()) {
            return new DashboardRecentStudentsResponse(List.of());
        }

        int safeLimit = Math.max(1, limit);
        List<RecentStudent> recent = studentRepository
                .findByInstitutionIdAndArchivedAtIsNullOrderByCreatedAtDesc(institutionId)
                .stream()
                .limit(safeLimit)
                .map(student -> new RecentStudent(
                        student.getId(),
                        (student.getFirstName() + " " + student.getLastName()).trim(),
                        student.getCreatedAt().toString()))
                .toList();

        return new DashboardRecentStudentsResponse(recent);
    }

    /** Real institutions, newest first — reuses the same search() query Institutions §4.1 already exercises, just unfiltered and limited. */
    public DashboardRecentInstitutionsResponse recentInstitutions(int limit) {
        int safeLimit = Math.max(1, limit);
        List<RecentInstitution> institutions = institutionRepository
                .search(null, false, false, false, PageRequest.of(0, safeLimit))
                .getContent()
                .stream()
                .map(i -> new RecentInstitution(
                        i.getId(), i.getName(), i.getModulesCount(), i.getCreatedAt(), i.getStatus()))
                .toList();

        return new DashboardRecentInstitutionsResponse(institutions);
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

    public record DashboardRecentInstitutionsResponse(List<RecentInstitution> data) {
    }

    public record RecentStudent(String id, String name, String registeredAt) {
    }

    public record RecentInstitution(String id, String name, long modulesCount, Instant createdAt, String status) {
    }
}
