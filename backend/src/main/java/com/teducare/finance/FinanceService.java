package com.teducare.finance;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.teducare.academics.AcademicSession;
import com.teducare.academics.AcademicSessionService;
import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelResponse;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.staff.StaffMemberResponse;
import com.teducare.staff.StaffMemberService;
import com.teducare.staffdesignation.StaffDesignationResponse;
import com.teducare.staffdesignation.StaffDesignationService;
import com.teducare.student.Student;
import com.teducare.student.StudentResponse;
import com.teducare.student.StudentService;

/**
 * Fee Structure (API_CONTRACT.md §17) — see {@link FeeType}/{@link
 * StudentBillLine}'s own doc comments for the scoping and charge/penalty
 * line shape. Creating or editing a fee (re-)bills every currently
 * active student matching its department/level/session scope; already
 * generated lines are never retroactively changed, even by an edit that
 * narrows the scope or changes the amount — a charge is what was
 * actually billed at the time, not a live-recomputed value.
 */
@Service
public class FinanceService {

    private static final Pattern CODE_SUFFIX = Pattern.compile("(\\d+)$");

    private final FeeTypeRepository feeTypeRepository;
    private final StudentBillLineRepository billLineRepository;
    private final StudentBillPaymentRepository paymentRepository;
    private final FinanceTransactionLogRepository logRepository;
    private final PaystackSettingsRepository paystackSettingsRepository;
    private final PaystackTransactionRepository paystackTransactionRepository;
    private final PaystackClient paystackClient;
    private final DepartmentService departmentService;
    private final ProgramLevelService programLevelService;
    private final AcademicSessionService academicSessionService;
    private final StudentService studentService;
    private final StaffMemberService staffMemberService;
    private final StaffDesignationService staffDesignationService;
    private final StaffPayrollProfileRepository payrollProfileRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;

    public FinanceService(
            FeeTypeRepository feeTypeRepository,
            StudentBillLineRepository billLineRepository,
            StudentBillPaymentRepository paymentRepository,
            FinanceTransactionLogRepository logRepository,
            PaystackSettingsRepository paystackSettingsRepository,
            PaystackTransactionRepository paystackTransactionRepository,
            PaystackClient paystackClient,
            DepartmentService departmentService,
            ProgramLevelService programLevelService,
            AcademicSessionService academicSessionService,
            StudentService studentService,
            StaffMemberService staffMemberService,
            StaffDesignationService staffDesignationService,
            StaffPayrollProfileRepository payrollProfileRepository,
            PayrollRunRepository payrollRunRepository,
            PayslipRepository payslipRepository) {
        this.feeTypeRepository = feeTypeRepository;
        this.billLineRepository = billLineRepository;
        this.paymentRepository = paymentRepository;
        this.logRepository = logRepository;
        this.paystackSettingsRepository = paystackSettingsRepository;
        this.paystackTransactionRepository = paystackTransactionRepository;
        this.paystackClient = paystackClient;
        this.departmentService = departmentService;
        this.programLevelService = programLevelService;
        this.academicSessionService = academicSessionService;
        this.studentService = studentService;
        this.staffMemberService = staffMemberService;
        this.staffDesignationService = staffDesignationService;
        this.payrollProfileRepository = payrollProfileRepository;
        this.payrollRunRepository = payrollRunRepository;
        this.payslipRepository = payslipRepository;
    }

    // ================= Fee Structure =================

    public List<FeeTypeResponse> listFeeTypes(String institutionId) {
        List<FeeType> feeTypes = feeTypeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(f -> f.getArchivedAt() == null)
                .toList();
        if (feeTypes.isEmpty()) {
            return List.of();
        }

        Map<String, Long> billedCountByFeeType = billLineRepository
                .findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(l -> StudentBillLine.TYPE_CHARGE.equals(l.getLineType()))
                .collect(Collectors.groupingBy(StudentBillLine::getFeeTypeId, Collectors.counting()));

        Map<String, String> departmentNames = departmentLookup(institutionId);
        Map<String, String> levelCodes = levelCodeLookup(institutionId);
        Map<String, String> sessionLabels = sessionLabelLookup(institutionId);

        return feeTypes.stream()
                .map(f -> toResponse(f, billedCountByFeeType.getOrDefault(f.getId(), 0L).intValue(),
                        departmentNames, levelCodes, sessionLabels))
                .sorted(Comparator.comparing(FeeTypeResponse::code))
                .toList();
    }

    public FeeTypeResponse createFeeType(String institutionId, FeeTypeRequest request) {
        validateScope(institutionId, request);
        AcademicSession session = academicSessionService.requireOwnSession(institutionId, request.academicSessionId());

        FeeType feeType = new FeeType(
                "feetype-" + UUID.randomUUID(), institutionId, nextCode(institutionId), request.name(),
                blankToNull(request.departmentId()), blankToNull(request.programLevelId()), session.getId(),
                request.amount(), request.dueDate(), request.latePenaltyType(), request.latePenaltyValue(),
                Instant.now(), null);
        feeTypeRepository.save(feeType);

        int billed = generateBillLines(institutionId, feeType);
        return toSingleResponse(institutionId, feeType, billed);
    }

    public FeeTypeResponse updateFeeType(String institutionId, String id, FeeTypeRequest request) {
        FeeType feeType = requireOwnFeeType(institutionId, id);
        validateScope(institutionId, request);
        AcademicSession session = academicSessionService.requireOwnSession(institutionId, request.academicSessionId());

        feeType.setName(request.name());
        feeType.setDepartmentId(blankToNull(request.departmentId()));
        feeType.setProgramLevelId(blankToNull(request.programLevelId()));
        feeType.setAcademicSessionId(session.getId());
        feeType.setAmount(request.amount());
        feeType.setDueDate(request.dueDate());
        feeType.setLatePenaltyType(request.latePenaltyType());
        feeType.setLatePenaltyValue(request.latePenaltyValue());
        feeTypeRepository.save(feeType);

        int billed = generateBillLines(institutionId, feeType);
        return toSingleResponse(institutionId, feeType, billed);
    }

    /** Archives the fee — existing bill lines are untouched (what was billed stays billed); no further students will be billed against it. */
    public void archiveFeeType(String institutionId, String id) {
        FeeType feeType = requireOwnFeeType(institutionId, id);
        feeType.setArchivedAt(Instant.now());
        feeTypeRepository.save(feeType);
    }

    public FeeType requireOwnFeeType(String institutionId, String id) {
        return feeTypeRepository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee not found."));
    }

    // ================= Student Bills =================

    /** One row per billed student — "Students: N · Billed: X · Paid: Y · Balance: Z" is just a sum of these. */
    public List<StudentBillSummaryResponse> listStudentBillSummaries(String institutionId, String academicSessionId) {
        ensureLatePenalties(institutionId);

        List<StudentBillLine> lines = billLineRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(l -> academicSessionId == null || academicSessionId.isBlank()
                        || academicSessionId.equals(l.getAcademicSessionId()))
                .toList();
        Map<String, List<StudentBillLine>> byStudent = lines.stream()
                .collect(Collectors.groupingBy(StudentBillLine::getStudentId));
        Map<String, StudentResponse> students = studentLookup(institutionId);
        Map<String, String> departmentNames = departmentLookup(institutionId);

        return byStudent.entrySet().stream()
                .map(entry -> {
                    StudentResponse student = students.get(entry.getKey());
                    if (student == null) {
                        return null;
                    }
                    BigDecimal billed = entry.getValue().stream()
                            .map(StudentBillLine::getChargeAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal balance = entry.getValue().stream()
                            .map(StudentBillLine::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal paid = billed.subtract(balance);
                    return new StudentBillSummaryResponse(
                            student.id(), student.matricNo() != null ? student.matricNo() : student.preAdmissionId(),
                            (student.firstName() + " " + student.lastName()).trim(),
                            departmentNames.getOrDefault(student.departmentId(), "—"),
                            billed, paid, balance, balance.signum() > 0 ? "OWING" : "PAID");
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(StudentBillSummaryResponse::balance).reversed())
                .toList();
    }

    /** The "Student Ledger" dialog — every charge/penalty line for this student, oldest first, with a running balance exactly like a bank statement. */
    public List<StudentLedgerLineResponse> ledger(String institutionId, String studentId) {
        studentService.requireOwnStudent(institutionId, studentId);
        ensureLatePenaltiesForStudent(institutionId, studentId);

        List<StudentBillLine> lines = billLineRepository
                .findByInstitutionIdAndStudentIdOrderByDueDateAsc(institutionId, studentId);
        Map<String, BigDecimal> paidByLine = paymentRepository
                .findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(institutionId, studentId).stream()
                .collect(Collectors.groupingBy(
                        StudentBillPayment::getBillLineId,
                        Collectors.reducing(BigDecimal.ZERO, StudentBillPayment::getAmount, BigDecimal::add)));

        BigDecimal running = BigDecimal.ZERO;
        List<StudentLedgerLineResponse> result = new ArrayList<>();
        for (StudentBillLine line : lines) {
            BigDecimal paidOnLine = paidByLine.getOrDefault(line.getId(), BigDecimal.ZERO);
            running = running.add(line.getChargeAmount()).subtract(paidOnLine);
            result.add(new StudentLedgerLineResponse(
                    line.getId(), line.getDueDate(), line.getDescription(), line.getReference(),
                    line.getChargeAmount(), paidOnLine.signum() > 0 ? paidOnLine : null, running, line.getBalance(),
                    line.getLineType()));
        }
        return result;
    }

    /** "Record Offline Payment" — one payment against exactly one fee line, same convention the reference design itself uses (no split-across-lines, no auto-allocation for a manual entry). */
    public void recordPayment(String institutionId, String studentId, RecordPaymentRequest request, String actorName) {
        studentService.requireOwnStudent(institutionId, studentId);
        StudentBillLine line = billLineRepository.findByIdAndInstitutionId(request.billLineId(), institutionId)
                .filter(l -> l.getStudentId().equals(studentId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee line not found."));

        if (request.amount().compareTo(line.getBalance()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Amount exceeds this line's remaining balance of " + line.getBalance() + ".");
        }
        if (StudentBillPayment.METHOD_BANK_TRANSFER.equals(request.method())
                && blankOrNull(request.proofUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proof of payment is required for bank transfers.");
        }

        Instant now = Instant.now();
        paymentRepository.save(new StudentBillPayment(
                "billpayment-" + UUID.randomUUID(), institutionId, studentId, line.getId(), request.amount(),
                request.method(), blankToNull(request.reference()), request.paymentDate(), blankToNull(request.proofUrl()),
                actorName, now));

        line.setBalance(line.getBalance().subtract(request.amount()));
        line.setUpdatedAt(now);
        billLineRepository.save(line);

        logRepository.save(new FinanceTransactionLog(
                "financelog-" + UUID.randomUUID(), institutionId, FinanceTransactionLog.PAYMENT_RECORDED, studentId,
                null, request.amount(), request.reference(),
                methodLabel(request.method()) + " payment recorded against " + line.getDescription() + " (" + line.getReference() + ")",
                actorName, now));
    }

    /** Lazily materializes a real {@code PENALTY} line (its own payable reference, e.g. "PEN-FEE-006") the first time any read notices a CHARGE line is overdue and still unpaid — never retroactively applied to an already-paid line, and never applied twice (guarded by the existing parent-line lookup). Institution-wide; called at the top of every Student Bills read so nothing has to remember to call it separately. */
    private void ensureLatePenalties(String institutionId) {
        Map<String, FeeType> feeTypes = feeTypeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .collect(Collectors.toMap(FeeType::getId, f -> f));
        List<StudentBillLine> overdueUnpaidCharges = billLineRepository
                .findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(l -> StudentBillLine.TYPE_CHARGE.equals(l.getLineType()))
                .filter(l -> l.getBalance().signum() > 0)
                .filter(l -> l.getDueDate().isBefore(LocalDate.now()))
                .toList();
        applyLatePenalties(institutionId, overdueUnpaidCharges, feeTypes);
    }

    private void ensureLatePenaltiesForStudent(String institutionId, String studentId) {
        Map<String, FeeType> feeTypes = feeTypeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .collect(Collectors.toMap(FeeType::getId, f -> f));
        List<StudentBillLine> overdueUnpaidCharges = billLineRepository
                .findByInstitutionIdAndStudentIdOrderByDueDateAsc(institutionId, studentId).stream()
                .filter(l -> StudentBillLine.TYPE_CHARGE.equals(l.getLineType()))
                .filter(l -> l.getBalance().signum() > 0)
                .filter(l -> l.getDueDate().isBefore(LocalDate.now()))
                .toList();
        applyLatePenalties(institutionId, overdueUnpaidCharges, feeTypes);
    }

    private void applyLatePenalties(String institutionId, List<StudentBillLine> overdueUnpaidCharges, Map<String, FeeType> feeTypes) {
        Instant now = Instant.now();
        for (StudentBillLine line : overdueUnpaidCharges) {
            FeeType feeType = feeTypes.get(line.getFeeTypeId());
            if (feeType == null || FeeType.PENALTY_NONE.equals(feeType.getLatePenaltyType())) {
                continue;
            }
            if (billLineRepository.findByInstitutionIdAndParentLineIdAndLineType(
                    institutionId, line.getId(), StudentBillLine.TYPE_PENALTY).isPresent()) {
                continue;
            }
            BigDecimal penaltyAmount = FeeType.PENALTY_FLAT.equals(feeType.getLatePenaltyType())
                    ? feeType.getLatePenaltyValue()
                    : line.getChargeAmount().multiply(feeType.getLatePenaltyValue())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            billLineRepository.save(new StudentBillLine(
                    "billline-" + UUID.randomUUID(), institutionId, line.getStudentId(), line.getFeeTypeId(),
                    StudentBillLine.TYPE_PENALTY, line.getId(), "Late penalty · " + line.getDescription(),
                    "PEN-" + line.getReference(), penaltyAmount, penaltyAmount, LocalDate.now(),
                    line.getAcademicSessionId(), now, now));
        }
    }

    private static String methodLabel(String method) {
        return switch (method) {
            case StudentBillPayment.METHOD_BANK_TRANSFER -> "Bank transfer";
            case StudentBillPayment.METHOD_CASH -> "Cash";
            case StudentBillPayment.METHOD_POS -> "POS";
            case StudentBillPayment.METHOD_CHEQUE -> "Cheque";
            case StudentBillPayment.METHOD_PAYSTACK -> "Paystack";
            default -> method;
        };
    }

    // ================= Paystack =================

    public PaystackSettingsResponse getPaystackSettings(String institutionId) {
        return PaystackSettingsResponse.from(paystackSettingsRepository.findByInstitutionId(institutionId).orElse(null));
    }

    /** Super-admin only (enforced by the controller) — stores the institution's own Paystack key pair; the secret key never round-trips back out through this or any other response. */
    public PaystackSettingsResponse updatePaystackSettings(String institutionId, PaystackSettingsRequest request) {
        PaystackSettings settings = paystackSettingsRepository.findByInstitutionId(institutionId)
                .orElse(new PaystackSettings(institutionId, request.publicKey(), request.secretKey(), request.enabled(), Instant.now()));
        settings.setPublicKey(request.publicKey());
        settings.setSecretKey(request.secretKey());
        settings.setEnabled(request.enabled());
        settings.setUpdatedAt(Instant.now());
        paystackSettingsRepository.save(settings);
        return PaystackSettingsResponse.from(settings);
    }

    /** Generates a hosted Paystack checkout link for this student's own session to complete in their own browser — this backend never collects or sees card details. */
    public PaystackLinkResponse initiatePaystackPayment(String institutionId, String studentId, PaystackLinkRequest request) {
        PaystackSettings settings = paystackSettingsRepository.findByInstitutionId(institutionId)
                .filter(PaystackSettings::isEnabled)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Online payment isn't set up for this institution yet."));
        Student student = studentService.requireOwnStudent(institutionId, studentId);

        String reference = "PSK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase(Locale.ROOT).replace("-", "");
        long amountKobo = request.amount().multiply(BigDecimal.valueOf(100)).longValueExact();
        String authorizationUrl = paystackClient.initializeTransaction(
                settings.getSecretKey(), student.getEmail(), amountKobo, reference);

        paystackTransactionRepository.save(new PaystackTransaction(
                "paystacktx-" + UUID.randomUUID(), institutionId, studentId, reference, request.amount(),
                PaystackTransaction.STATUS_PENDING, authorizationUrl, Instant.now(), null));

        return new PaystackLinkResponse(authorizationUrl, reference);
    }

    /**
     * Verifies the webhook really came from Paystack (HMAC over the raw
     * body with this institution's own secret key — never trust the
     * payload before this passes), then on {@code charge.success} auto-
     * allocates the paid amount across the student's unpaid lines,
     * oldest-due-first, logging the same "Gateway payment received" +
     * "Payment allocated" pair the reference design's own Transaction
     * Logs shows for every such payment. Idempotent — a transaction
     * already marked {@code SUCCESS} is a silent no-op on a retried
     * webhook delivery (Paystack retries on anything but a 2xx).
     */
    public void handlePaystackWebhook(String institutionId, String rawBody, String signatureHeader) {
        PaystackSettings settings = paystackSettingsRepository.findByInstitutionId(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found."));
        if (!paystackClient.verifySignature(settings.getSecretKey(), rawBody, signatureHeader)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature.");
        }

        JsonNode root;
        try {
            root = paystackClient.objectMapper().readTree(rawBody);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed webhook payload.");
        }
        if (!"charge.success".equals(root.path("event").asText())) {
            return;
        }
        String reference = root.path("data").path("reference").asText();
        PaystackTransaction transaction = paystackTransactionRepository.findByReference(reference).orElse(null);
        if (transaction == null || !transaction.getInstitutionId().equals(institutionId)) {
            return;
        }
        if (!PaystackTransaction.STATUS_PENDING.equals(transaction.getStatus())) {
            return;
        }

        transaction.setStatus(PaystackTransaction.STATUS_SUCCESS);
        transaction.setPaidAt(Instant.now());
        paystackTransactionRepository.save(transaction);

        allocateOldestDueFirst(institutionId, transaction.getStudentId(), transaction.getAmount(), reference);
    }

    /** Same allocation engine a Paystack gateway payment always uses — oldest {@code dueDate} first, across as many lines as the amount covers, logging the "Gateway payment received" / "Payment allocated" pair exactly as the reference design's Transaction Logs shows it. */
    private void allocateOldestDueFirst(String institutionId, String studentId, BigDecimal amount, String reference) {
        StudentResponse student = studentLookup(institutionId).get(studentId);
        String matricNo = student == null ? studentId : (student.matricNo() != null ? student.matricNo() : student.preAdmissionId());
        String sessionLabel = student == null ? ""
                : sessionLabelLookup(institutionId).getOrDefault(student.currentSessionId(), "");

        Instant now = Instant.now();
        logRepository.save(new FinanceTransactionLog(
                "financelog-" + UUID.randomUUID(), institutionId, FinanceTransactionLog.GATEWAY_PAYMENT_RECEIVED,
                studentId, null, amount, reference,
                (student == null ? matricNo : (student.firstName() + " " + student.lastName()).trim()) + " (" + matricNo + ") · " + sessionLabel,
                "Paystack (automatic)", now));

        List<StudentBillLine> unpaidLines = billLineRepository
                .findByInstitutionIdAndStudentIdOrderByDueDateAsc(institutionId, studentId).stream()
                .filter(l -> l.getBalance().signum() > 0)
                .toList();

        BigDecimal remaining = amount;
        int linesTouched = 0;
        for (StudentBillLine line : unpaidLines) {
            if (remaining.signum() <= 0) {
                break;
            }
            BigDecimal applied = remaining.min(line.getBalance());
            paymentRepository.save(new StudentBillPayment(
                    "billpayment-" + UUID.randomUUID(), institutionId, studentId, line.getId(), applied,
                    StudentBillPayment.METHOD_PAYSTACK, reference, LocalDate.now(), null, "Paystack (automatic)", now));
            line.setBalance(line.getBalance().subtract(applied));
            line.setUpdatedAt(now);
            billLineRepository.save(line);
            remaining = remaining.subtract(applied);
            linesTouched++;
        }

        logRepository.save(new FinanceTransactionLog(
                "financelog-" + UUID.randomUUID(), institutionId, FinanceTransactionLog.PAYMENT_ALLOCATED,
                studentId, null, amount, reference,
                "Oldest due first: " + matricNo + " → " + linesTouched + " fee line" + (linesTouched == 1 ? "" : "s"),
                "System (auto-allocated)", now));
    }

    // ================= Payroll =================

    /** The Staff Payroll table for a given period — PENDING rows are a live projection (salary + profile, not yet persisted); once run, the same staff show their real frozen {@link Payslip}. */
    public List<PayrollRowResponse> listPayroll(String institutionId, int periodYear, int periodMonth) {
        List<StaffMemberResponse> staff = staffMemberService.list(institutionId, null, null, false);
        Map<String, StaffPayrollProfile> profiles = payrollProfileRepository.findByInstitutionId(institutionId).stream()
                .collect(Collectors.toMap(StaffPayrollProfile::getStaffId, p -> p));
        Map<String, Payslip> payslips = payslipRepository
                .findByInstitutionIdAndPeriodYearAndPeriodMonth(institutionId, periodYear, periodMonth).stream()
                .collect(Collectors.toMap(Payslip::getStaffId, p -> p));
        Map<String, String> designationNames = staffDesignationService.list(institutionId, true).stream()
                .collect(Collectors.toMap(StaffDesignationResponse::id, StaffDesignationResponse::name));
        Map<String, String> departmentNames = departmentLookup(institutionId);

        return staff.stream()
                .map(member -> {
                    StaffPayrollProfile profile = profiles.get(member.id());
                    BigDecimal allowances = profile == null ? BigDecimal.ZERO : profile.getAllowances();
                    BigDecimal deductions = profile == null ? BigDecimal.ZERO : profile.getDeductions();
                    boolean onHold = profile != null && profile.isOnHold();
                    Payslip payslip = payslips.get(member.id());

                    BigDecimal basicPay = payslip != null ? payslip.getBasicPay()
                            : (member.salaryAmount() == null ? BigDecimal.ZERO : member.salaryAmount());
                    BigDecimal rowAllowances = payslip != null ? payslip.getAllowances() : allowances;
                    BigDecimal rowDeductions = payslip != null ? payslip.getDeductions() : deductions;
                    BigDecimal netPay = payslip != null ? payslip.getNetPay()
                            : basicPay.add(rowAllowances).subtract(rowDeductions);
                    String status = payslip != null ? "PAID" : (onHold ? "ON_HOLD" : "PENDING");

                    return new PayrollRowResponse(
                            member.id(), member.staffId(), (member.firstName() + " " + member.lastName()).trim(),
                            designationNames.getOrDefault(member.designationId(), "—"),
                            departmentNames.getOrDefault(member.departmentId(), "—"),
                            basicPay, rowAllowances, rowDeductions, netPay, onHold,
                            profile == null ? null : profile.getOnHoldReason(), status);
                })
                .sorted(Comparator.comparing(PayrollRowResponse::staffName))
                .toList();
    }

    public PayrollRowResponse updatePayrollProfile(String institutionId, String staffId, UpdatePayrollProfileRequest request) {
        staffMemberService.requireOwnStaffMember(institutionId, staffId);
        StaffPayrollProfile profile = payrollProfileRepository.findByInstitutionIdAndStaffId(institutionId, staffId)
                .orElse(new StaffPayrollProfile(staffId, institutionId, request.allowances(), request.deductions(),
                        request.onHold(), blankToNull(request.onHoldReason()), Instant.now()));
        profile.setAllowances(request.allowances());
        profile.setDeductions(request.deductions());
        profile.setOnHold(request.onHold());
        profile.setOnHoldReason(blankToNull(request.onHoldReason()));
        profile.setUpdatedAt(Instant.now());
        payrollProfileRepository.save(profile);

        LocalDate now = LocalDate.now();
        return listPayroll(institutionId, now.getYear(), now.getMonthValue()).stream()
                .filter(r -> r.staffId().equals(staffId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff member not found."));
    }

    /**
     * Calculates net pay for every non-archived, non-on-hold staff member
     * with a configured salary and snapshots it into a real {@link
     * Payslip}, in one new {@link PayrollRun} — rejected with `409` if
     * this exact period was already run, matching the reference design's
     * own "can't be undone from here." Logs one aggregate {@code
     * PAYROLL_RUN} entry in the Transaction Log, not one per staff member
     * (the reference design shows payroll as a single event, unlike the
     * per-line granularity of a student payment).
     */
    public RunPayrollResultResponse runPayroll(String institutionId, RunPayrollRequest request, String actorName) {
        if (payrollRunRepository.findByInstitutionIdAndPeriodYearAndPeriodMonth(
                institutionId, request.periodYear(), request.periodMonth()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payroll for this period has already been run.");
        }

        List<StaffMemberResponse> staff = staffMemberService.list(institutionId, null, null, false);
        Map<String, StaffPayrollProfile> profiles = payrollProfileRepository.findByInstitutionId(institutionId).stream()
                .collect(Collectors.toMap(StaffPayrollProfile::getStaffId, p -> p));

        Instant now = Instant.now();
        PayrollRun run = payrollRunRepository.save(new PayrollRun(
                "payrollrun-" + UUID.randomUUID(), institutionId, request.periodYear(), request.periodMonth(),
                actorName, now));

        int staffPaid = 0;
        int staffOnHold = 0;
        BigDecimal netPayroll = BigDecimal.ZERO;
        for (StaffMemberResponse member : staff) {
            StaffPayrollProfile profile = profiles.get(member.id());
            if (profile != null && profile.isOnHold()) {
                staffOnHold++;
                continue;
            }
            if (member.salaryAmount() == null) {
                continue;
            }
            BigDecimal allowances = profile == null ? BigDecimal.ZERO : profile.getAllowances();
            BigDecimal deductions = profile == null ? BigDecimal.ZERO : profile.getDeductions();
            BigDecimal netPay = member.salaryAmount().add(allowances).subtract(deductions);

            payslipRepository.save(new Payslip(
                    "payslip-" + UUID.randomUUID(), institutionId, run.getId(), member.id(), request.periodYear(),
                    request.periodMonth(), member.salaryAmount(), allowances, deductions, netPay, now));
            staffPaid++;
            netPayroll = netPayroll.add(netPay);
        }

        logRepository.save(new FinanceTransactionLog(
                "financelog-" + UUID.randomUUID(), institutionId, FinanceTransactionLog.PAYROLL_RUN, null, null,
                netPayroll, null,
                "Payroll run for " + request.periodMonth() + "/" + request.periodYear() + " — " + staffPaid
                        + " staff paid" + (staffOnHold > 0 ? ", " + staffOnHold + " on hold" : ""),
                actorName, now));

        return new RunPayrollResultResponse(staffPaid, staffOnHold, netPayroll);
    }

    public List<PayslipResponse> payslipHistory(String institutionId, String staffId) {
        com.teducare.staff.StaffMember member = staffMemberService.requireOwnStaffMember(institutionId, staffId);
        String designationName = staffDesignationService.list(institutionId, true).stream()
                .filter(d -> d.id().equals(member.getDesignationId())).findFirst().map(StaffDesignationResponse::name).orElse("—");
        String departmentName = departmentLookup(institutionId).getOrDefault(member.getDepartmentId(), "—");

        return payslipRepository
                .findByInstitutionIdAndStaffIdOrderByPeriodYearDescPeriodMonthDesc(institutionId, staffId).stream()
                .map(p -> new PayslipResponse(
                        p.getId(), p.getPeriodYear(), p.getPeriodMonth(),
                        (member.getFirstName() + " " + member.getLastName()).trim(), designationName, departmentName,
                        p.getBasicPay(), p.getAllowances(), p.getDeductions(), p.getNetPay(), p.getCreatedAt()))
                .toList();
    }

    // ================= Transaction Logs =================

    public List<FinanceTransactionLogResponse> listTransactionLog(String institutionId) {
        Map<String, StudentResponse> students = studentLookup(institutionId);
        return logRepository.findByInstitutionIdOrderByCreatedAtDesc(institutionId).stream()
                .map(entry -> {
                    StudentResponse student = entry.getStudentId() == null ? null : students.get(entry.getStudentId());
                    return new FinanceTransactionLogResponse(
                            entry.getId(), entry.getEventType(),
                            student == null ? null : (student.matricNo() != null ? student.matricNo() : student.preAdmissionId()),
                            student == null ? null : (student.firstName() + " " + student.lastName()).trim(),
                            entry.getAmount(), entry.getReference(), entry.getDetails(), entry.getRecordedByName(),
                            entry.getCreatedAt());
                })
                .toList();
    }

    /** Bills every currently-active student matching the fee's department/level/session scope who doesn't already have a CHARGE line for it — safe to call again on an edit, since the unique (student, fee) CHARGE guard makes it idempotent. Returns the number of students newly billed. */
    private int generateBillLines(String institutionId, FeeType feeType) {
        List<StudentResponse> matching = studentService.list(
                institutionId, null, null, null, feeType.getDepartmentId(), null, feeType.getProgramLevelId(),
                feeType.getAcademicSessionId(), false);

        Instant now = Instant.now();
        int newlyBilled = 0;
        for (StudentResponse student : matching) {
            if (billLineRepository.existsByInstitutionIdAndStudentIdAndFeeTypeIdAndLineType(
                    institutionId, student.id(), feeType.getId(), StudentBillLine.TYPE_CHARGE)) {
                continue;
            }
            billLineRepository.save(new StudentBillLine(
                    "billline-" + UUID.randomUUID(), institutionId, student.id(), feeType.getId(),
                    StudentBillLine.TYPE_CHARGE, null, feeType.getName(), feeType.getCode(), feeType.getAmount(),
                    feeType.getAmount(), feeType.getDueDate(), feeType.getAcademicSessionId(), now, now));
            newlyBilled++;
        }
        return newlyBilled;
    }

    private void validateScope(String institutionId, FeeTypeRequest request) {
        if (!blankOrNull(request.departmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
        }
        if (!blankOrNull(request.programLevelId())) {
            programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
        }
        if (!Set.of(FeeType.PENALTY_NONE, FeeType.PENALTY_FLAT, FeeType.PENALTY_PERCENTAGE)
                .contains(request.latePenaltyType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid late penalty type.");
        }
        boolean needsValue = !FeeType.PENALTY_NONE.equals(request.latePenaltyType());
        if (needsValue && (request.latePenaltyValue() == null || request.latePenaltyValue().signum() <= 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "A late penalty value is required for this penalty type.");
        }
    }

    private String nextCode(String institutionId) {
        int max = feeTypeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .mapToInt(f -> {
                    Matcher m = CODE_SUFFIX.matcher(f.getCode());
                    return m.find() ? Integer.parseInt(m.group(1)) : 0;
                })
                .max()
                .orElse(0);
        return "FEE-%03d".formatted(max + 1);
    }

    private FeeTypeResponse toSingleResponse(String institutionId, FeeType feeType, int justBilledDelta) {
        long totalBilled = billLineRepository.findByInstitutionIdAndFeeTypeId(institutionId, feeType.getId()).stream()
                .filter(l -> StudentBillLine.TYPE_CHARGE.equals(l.getLineType()))
                .count();
        return toResponse(feeType, (int) totalBilled, departmentLookup(institutionId), levelCodeLookup(institutionId),
                sessionLabelLookup(institutionId));
    }

    private FeeTypeResponse toResponse(
            FeeType feeType, int studentsBilled, Map<String, String> departmentNames,
            Map<String, String> levelCodes, Map<String, String> sessionLabels) {
        return new FeeTypeResponse(
                feeType.getId(), feeType.getCode(), feeType.getName(),
                feeType.getDepartmentId(), feeType.getDepartmentId() == null ? null : departmentNames.get(feeType.getDepartmentId()),
                feeType.getProgramLevelId(), feeType.getProgramLevelId() == null ? null : levelCodes.get(feeType.getProgramLevelId()),
                feeType.getAcademicSessionId(), sessionLabels.getOrDefault(feeType.getAcademicSessionId(), "—"),
                feeType.getAmount(), feeType.getDueDate(), feeType.getLatePenaltyType(), feeType.getLatePenaltyValue(),
                studentsBilled, feeType.getCreatedAt());
    }

    private Map<String, StudentResponse> studentLookup(String institutionId) {
        return studentService.list(institutionId, null, null, null, null, null, null, null, false).stream()
                .collect(Collectors.toMap(StudentResponse::id, s -> s));
    }

    private Map<String, String> departmentLookup(String institutionId) {
        return departmentService.list(institutionId, null, null, true).stream()
                .collect(Collectors.toMap(DepartmentResponse::id, DepartmentResponse::name));
    }

    private Map<String, String> levelCodeLookup(String institutionId) {
        return programLevelService.list(institutionId, true).stream()
                .collect(Collectors.toMap(ProgramLevelResponse::id, ProgramLevelResponse::levelCode));
    }

    private Map<String, String> sessionLabelLookup(String institutionId) {
        return academicSessionService.list(institutionId, true).stream()
                .collect(Collectors.toMap(com.teducare.academics.AcademicSessionResponse::id,
                        com.teducare.academics.AcademicSessionResponse::session));
    }

    private static boolean blankOrNull(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        return blankOrNull(value) ? null : value;
    }
}
