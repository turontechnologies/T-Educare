package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSession;
import com.teducare.academics.AcademicSessionService;
import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelResponse;
import com.teducare.programlevel.ProgramLevelService;
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
    private final DepartmentService departmentService;
    private final ProgramLevelService programLevelService;
    private final AcademicSessionService academicSessionService;
    private final StudentService studentService;

    public FinanceService(
            FeeTypeRepository feeTypeRepository,
            StudentBillLineRepository billLineRepository,
            DepartmentService departmentService,
            ProgramLevelService programLevelService,
            AcademicSessionService academicSessionService,
            StudentService studentService) {
        this.feeTypeRepository = feeTypeRepository;
        this.billLineRepository = billLineRepository;
        this.departmentService = departmentService;
        this.programLevelService = programLevelService;
        this.academicSessionService = academicSessionService;
        this.studentService = studentService;
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
