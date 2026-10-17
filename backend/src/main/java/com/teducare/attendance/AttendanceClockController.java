package com.teducare.attendance;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

/**
 * The one endpoint a biometric clock-in machine (or its middleware) ever
 * calls — publicly reachable (see SecurityConfig's permitAll for this exact
 * path), authenticated by the device's own API key instead of a JWT, since
 * a physical machine has no institution_admin login of its own. This is
 * the whole "easy to integrate a biometric machine" story: register a
 * device in Time &amp; Attendance &gt; Devices, configure the machine/middleware
 * to POST here with the returned key on every tap, done.
 */
@RestController
@RequestMapping("/api/attendance/clock-events")
public class AttendanceClockController {

    private final AttendanceService service;

    public AttendanceClockController(AttendanceService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AttendanceEventResponse> clockEvent(
            @RequestHeader(value = "X-Device-Api-Key", required = false) String apiKey,
            @Valid @RequestBody ClockEventRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing X-Device-Api-Key header.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.recordDeviceClockEvent(apiKey, request));
    }
}
