package com.teducare.dashboard;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teducare.auth.AuthDirectory;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthDirectory authDirectory;

    public DashboardController(DashboardService dashboardService, AuthDirectory authDirectory) {
        this.dashboardService = dashboardService;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/super-admin/stats")
    public ResponseEntity<Map<String, Object>> superAdminStats(Authentication authentication) {
        DashboardService.SuperAdminStatsResponse stats = dashboardService.superAdminStats();
        return ResponseEntity.ok(Map.of(
                "institutionsCount", stats.institutionsCount(),
                "totalStudents", stats.totalStudents(),
                "totalRevenue", stats.totalRevenue()));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> dashboardStats(Authentication authentication) {
        DashboardService.DashboardStatsResponse stats =
                dashboardService.institutionStats(resolveInstitutionId(authentication));
        return ResponseEntity.ok(Map.of(
                "registeredStudents", stats.registeredStudents(),
                "applicants", stats.applicants(),
                "lecturers", stats.lecturers(),
                "accumulatedProfit", stats.accumulatedProfit()));
    }

    @GetMapping("/dashboard/enrollment")
    public ResponseEntity<Map<String, Object>> enrollment(@RequestParam(defaultValue = "day") String range) {
        return ResponseEntity.ok(Map.of("data", dashboardService.enrollment(range).data()));
    }

    @GetMapping("/dashboard/recent-students")
    public ResponseEntity<Map<String, Object>> recentStudents(@RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(Map.of("data", dashboardService.recentStudents(limit).data()));
    }

    @GetMapping("/super-admin/recent-institutions")
    public ResponseEntity<Map<String, Object>> recentInstitutions(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(Map.of("data", dashboardService.recentInstitutions(limit).data()));
    }

    /** The JWT subject is the login username, not an institutionId — resolve the real one via the directory. */
    private String resolveInstitutionId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return authDirectory.find(authentication.getName())
                .map(account -> account.user().institutionId())
                .orElse(null);
    }
}
