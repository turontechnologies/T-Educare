package com.teducare.dashboard;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionRepository;

@Service
public class DashboardService {

    private final InstitutionRepository institutionRepository;

    public DashboardService(InstitutionRepository institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    /** Real, platform-wide aggregates over every active institution — never hardcoded. */
    public SuperAdminStatsResponse superAdminStats() {
        return new SuperAdminStatsResponse(
                institutionRepository.countActive(),
                institutionRepository.sumActiveStudentCount(),
                institutionRepository.sumActiveRevenue());
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
