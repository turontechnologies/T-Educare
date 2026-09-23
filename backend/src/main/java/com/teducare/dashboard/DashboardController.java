package com.teducare.dashboard;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
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
        String institutionId = authentication != null && authentication.getName() != null
                ? authentication.getName()
                : null;

        DashboardService.DashboardStatsResponse stats = dashboardService.institutionStats(institutionId);
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
}
