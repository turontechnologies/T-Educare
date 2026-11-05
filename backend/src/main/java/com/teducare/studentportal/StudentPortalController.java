package com.teducare.studentportal;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teducare.finance.PaystackLinkRequest;
import com.teducare.finance.PaystackLinkResponse;
import com.teducare.studentauth.CurrentStudent;
import com.teducare.studentauth.CurrentStudentResolver;

import jakarta.validation.Valid;

/** The Student Portal's own self-service data — every endpoint is implicitly scoped to the caller's own student record, resolved from their JWT via CurrentStudentResolver; there is no "pick a student" parameter anywhere here. */
@RestController
@RequestMapping("/api/student-portal")
public class StudentPortalController {

    private final StudentPortalService service;
    private final CurrentStudentResolver currentStudentResolver;

    public StudentPortalController(StudentPortalService service, CurrentStudentResolver currentStudentResolver) {
        this.service = service;
        this.currentStudentResolver = currentStudentResolver;
    }

    @GetMapping("/academic-summary")
    public StudentAcademicSummaryResponse academicSummary(Authentication authentication) {
        CurrentStudent current = currentStudentResolver.require(authentication);
        return service.academicSummary(current.institutionId(), current.studentId());
    }

    @GetMapping("/hostel-status")
    public StudentHostelStatusResponse hostelStatus(Authentication authentication) {
        CurrentStudent current = currentStudentResolver.require(authentication);
        return service.hostelStatus(current.institutionId(), current.studentId());
    }

    @GetMapping("/bills")
    public StudentBillsResponse bills(Authentication authentication) {
        CurrentStudent current = currentStudentResolver.require(authentication);
        return service.bills(current.institutionId(), current.studentId());
    }

    @PostMapping("/bills/pay-link")
    public PaystackLinkResponse paystackLink(Authentication authentication, @Valid @RequestBody PaystackLinkRequest request) {
        CurrentStudent current = currentStudentResolver.require(authentication);
        return service.initiatePayment(current.institutionId(), current.studentId(), request);
    }
}
