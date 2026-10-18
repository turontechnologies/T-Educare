package com.teducare.attendance;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/**
 * Time &amp; Attendance, institution_admin side (API_CONTRACT.md) — settings,
 * devices, overview, per-staff history, and manual entry. A staff member's
 * own view is {@link AttendanceSelfServiceController}; a biometric device's
 * clock-event push is {@link AttendanceClockController} (no JWT at all).
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService service;
    private final AuthDirectory authDirectory;

    public AttendanceController(AttendanceService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/settings")
    public AttendanceSettingsResponse getSettings(Authentication authentication) {
        return service.getSettings(requireInstitutionId(authentication));
    }

    @PatchMapping("/settings")
    public AttendanceSettingsResponse updateSettings(
            Authentication authentication, @RequestBody UpdateAttendanceSettingsRequest request) {
        return service.updateSettings(requireInstitutionId(authentication), request);
    }

    @GetMapping("/devices")
    public List<AttendanceDeviceResponse> listDevices(Authentication authentication) {
        return service.listDevices(requireInstitutionId(authentication));
    }

    @PostMapping("/devices")
    public ResponseEntity<AttendanceDeviceCreatedResponse> createDevice(
            Authentication authentication, @Valid @RequestBody CreateAttendanceDeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createDevice(requireInstitutionId(authentication), request));
    }

    @DeleteMapping("/devices/{id}")
    public AttendanceDeviceResponse revokeDevice(Authentication authentication, @PathVariable String id) {
        return service.revokeDevice(requireInstitutionId(authentication), id);
    }

    @GetMapping("/overview")
    public AttendanceOverviewResponse getOverview(
            Authentication authentication, @RequestParam(required = false) String date) {
        LocalDate resolvedDate = isPresent(date) ? LocalDate.parse(date) : LocalDate.now();
        return service.getOverview(requireInstitutionId(authentication), resolvedDate);
    }

    @GetMapping("/trend")
    public List<AttendanceTrendPoint> getTrend(
            Authentication authentication, @RequestParam(defaultValue = "14") int days) {
        return service.getTrend(requireInstitutionId(authentication), days);
    }

    @GetMapping("/staff/{staffId}/history")
    public List<DailyAttendanceEntry> getStaffHistory(
            Authentication authentication,
            @PathVariable String staffId,
            @RequestParam String from,
            @RequestParam String to) {
        return service.getStaffHistory(requireInstitutionId(authentication), staffId, LocalDate.parse(from), LocalDate.parse(to));
    }

    @PostMapping("/manual-entries")
    public ResponseEntity<AttendanceEventResponse> recordManualEntry(
            Authentication authentication, @Valid @RequestBody RecordManualAttendanceRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.recordManualEvent(caller.institutionId(), caller.id(), request));
    }

    private String requireInstitutionId(Authentication authentication) {
        return requireCaller(authentication).institutionId();
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
