package com.teducare.finance;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Financials — Fee Structure (API_CONTRACT.md §17) — always "my own institution's", resolved from the caller. */
@RestController
@RequestMapping("/api/financials")
public class FinanceController {

    private final FinanceService service;
    private final AuthDirectory authDirectory;

    public FinanceController(FinanceService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/fee-types")
    public List<FeeTypeResponse> listFeeTypes(Authentication authentication) {
        return service.listFeeTypes(requireInstitutionId(authentication));
    }

    @PostMapping("/fee-types")
    public ResponseEntity<FeeTypeResponse> createFeeType(
            Authentication authentication, @Valid @RequestBody FeeTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createFeeType(requireInstitutionId(authentication), request));
    }

    @PutMapping("/fee-types/{id}")
    public FeeTypeResponse updateFeeType(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody FeeTypeRequest request) {
        return service.updateFeeType(requireInstitutionId(authentication), id, request);
    }

    @DeleteMapping("/fee-types/{id}")
    public ResponseEntity<Void> archiveFeeType(Authentication authentication, @PathVariable String id) {
        service.archiveFeeType(requireInstitutionId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    // ---- Student Bills ----

    @GetMapping("/student-bills")
    public List<StudentBillSummaryResponse> listStudentBills(
            Authentication authentication, @RequestParam(required = false) String academicSessionId) {
        return service.listStudentBillSummaries(requireInstitutionId(authentication), academicSessionId);
    }

    @GetMapping("/student-bills/{studentId}/ledger")
    public List<StudentLedgerLineResponse> ledger(Authentication authentication, @PathVariable String studentId) {
        return service.ledger(requireInstitutionId(authentication), studentId);
    }

    @PostMapping("/student-bills/{studentId}/payments")
    public ResponseEntity<Void> recordPayment(
            Authentication authentication, @PathVariable String studentId,
            @Valid @RequestBody RecordPaymentRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        service.recordPayment(caller.institutionId(), studentId, request, caller.firstName() + " " + caller.lastName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/student-bills/{studentId}/paystack-link")
    public PaystackLinkResponse initiatePaystackPayment(
            Authentication authentication, @PathVariable String studentId,
            @Valid @RequestBody PaystackLinkRequest request) {
        return service.initiatePaystackPayment(requireInstitutionId(authentication), studentId, request);
    }

    // ---- Payroll ----

    @GetMapping("/payroll")
    public List<PayrollRowResponse> listPayroll(
            Authentication authentication, @RequestParam int periodYear, @RequestParam int periodMonth) {
        return service.listPayroll(requireInstitutionId(authentication), periodYear, periodMonth);
    }

    @PutMapping("/payroll/profiles/{staffId}")
    public PayrollRowResponse updatePayrollProfile(
            Authentication authentication, @PathVariable String staffId,
            @Valid @RequestBody UpdatePayrollProfileRequest request) {
        return service.updatePayrollProfile(requireInstitutionId(authentication), staffId, request);
    }

    @PostMapping("/payroll/run")
    public RunPayrollResultResponse runPayroll(
            Authentication authentication, @Valid @RequestBody RunPayrollRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return service.runPayroll(caller.institutionId(), request, caller.firstName() + " " + caller.lastName());
    }

    @GetMapping("/payroll/staff/{staffId}/payslips")
    public List<PayslipResponse> payslipHistory(Authentication authentication, @PathVariable String staffId) {
        return service.payslipHistory(requireInstitutionId(authentication), staffId);
    }

    // ---- Transaction Logs ----

    @GetMapping("/transaction-log")
    public List<FinanceTransactionLogResponse> listTransactionLog(Authentication authentication) {
        return service.listTransactionLog(requireInstitutionId(authentication));
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

    private String requireInstitutionId(Authentication authentication) {
        return requireCaller(authentication).institutionId();
    }
}
