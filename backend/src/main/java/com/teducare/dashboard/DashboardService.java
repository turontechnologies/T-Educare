package com.teducare.dashboard;

import java.util.List;

import org.springframework.stereotype.Service;

import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionRepository;

@Service
public class DashboardService {

    private final InstitutionRepository institutionRepository;

    public DashboardService(InstitutionRepository institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    public SuperAdminStatsResponse superAdminStats() {
        return new SuperAdminStatsResponse(27, 5622, 1528600);
    }

    /**
     * {@code registeredStudents}/{@code accumulatedProfit} read the real,
     * per-institution {@code studentCount}/{@code revenue} columns (real
     * since the Institutions build, just never read by this endpoint
     * before). {@code applicants}/{@code lecturers} are honestly {@code 0}
     * rather than fabricated — no real resource tracks either yet
     * (Applicants/Lecturers have no backend at all); update these once one
     * exists instead of inventing a number in the meantime.
     */
    public DashboardStatsResponse institutionStats(String institutionId) {
        if (institutionId == null || institutionId.isBlank()) {
            return new DashboardStatsResponse(0, 0, 0, 0);
        }

        return institutionRepository.findById(institutionId)
                .map(this::toStatsResponse)
                .orElseGet(() -> new DashboardStatsResponse(0, 0, 0, 0));
    }

    private DashboardStatsResponse toStatsResponse(Institution institution) {
        return new DashboardStatsResponse(institution.getStudentCount(), 0, 0, institution.getRevenue());
    }

    /** No real Students resource exists yet — honestly empty rather than fabricated. Populate once Students (§7/§8-ish, not yet in API_CONTRACT.md) is real. */
    public DashboardEnrollmentResponse enrollment(String range) {
        return new DashboardEnrollmentResponse(List.of());
    }

    /** Same reasoning as enrollment() — no real Students resource to draw "recent" from yet. */
    public DashboardRecentStudentsResponse recentStudents(int limit) {
        return new DashboardRecentStudentsResponse(List.of());
    }

    public DashboardRecentInstitutionsResponse recentInstitutions(int limit) {
        int safeLimit = Math.max(1, limit);
        List<RecentInstitution> institutions = List.of(
                new RecentInstitution("inst-landmark", "Landmark University", 7, "2026-03-03T14:32:00.000Z", "active"),
                new RecentInstitution("inst-rivers", "Rivers State University", 0, "2026-03-03T11:13:00.000Z",
                        "active"),
                new RecentInstitution("inst-benin", "University of Benin", 0, "2026-03-03T09:15:00.000Z", "active"),
                new RecentInstitution("inst-afebabalola", "Afe Babalola University", 7, "2026-03-03T08:07:00.000Z",
                        "active"),
                new RecentInstitution("inst-redeemer", "Redeemer's University", 6, "2026-03-03T10:21:00.000Z",
                        "inactive"));

        return new DashboardRecentInstitutionsResponse(institutions.stream().limit(safeLimit).toList());
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

    public record RecentInstitution(String id, String name, long modulesCount, String createdAt, String status) {
    }
}
