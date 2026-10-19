package com.teducare.attendance;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;
import com.teducare.export.ExportFormat;

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
            Authentication authentication,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String departmentId) {
        LocalDate resolvedDate = isPresent(date) ? LocalDate.parse(date) : LocalDate.now();
        return service.getOverview(requireInstitutionId(authentication), resolvedDate, departmentId);
    }

    @GetMapping("/trend")
    public List<AttendanceTrendPoint> getTrend(
            Authentication authentication,
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(required = false) String departmentId) {
        return service.getTrend(requireInstitutionId(authentication), days, departmentId);
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

    @GetMapping("/manual-entries/import-template")
    public ResponseEntity<byte[]> importTemplate(Authentication authentication) {
        return csvResponse(service.templateCsv(requireInstitutionId(authentication)), "attendance-template.csv");
    }

    @GetMapping("/manual-entries/export")
    public ResponseEntity<byte[]> export(
            Authentication authentication,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String format) {
        Instant fromInstant = LocalDate.parse(from).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = LocalDate.parse(to).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        ExportFormat resolvedFormat = ExportFormat.from(format);
        byte[] body = service.export(requireInstitutionId(authentication), fromInstant, toInstant, resolvedFormat);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resolvedFormat.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("attendance." + resolvedFormat.extension())
                                .build()
                                .toString())
                .body(body);
    }

    @PostMapping(value = "/manual-entries/import", consumes = "multipart/form-data")
    public AttendanceService.AttendanceImportResult importCsv(
            Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        AuthenticatedUserDto caller = requireCaller(authentication);
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return service.importCsv(caller.institutionId(), caller.id(), text);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded file.");
        }
    }

    private ResponseEntity<byte[]> csvResponse(String csv, String filename) {
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(body);
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
