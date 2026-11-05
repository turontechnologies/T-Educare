package com.teducare.studentportal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.teducare.academics.AcademicSemester;
import com.teducare.academics.AcademicSemesterResponse;
import com.teducare.academics.AcademicSemesterService;
import com.teducare.academics.AcademicSession;
import com.teducare.academics.AcademicSessionService;
import com.teducare.course.Course;
import com.teducare.course.CourseService;
import com.teducare.courseresult.CgpaResponse;
import com.teducare.courseresult.CourseResultService;
import com.teducare.courseresult.GpaResponse;
import com.teducare.department.Department;
import com.teducare.department.DepartmentService;
import com.teducare.finance.FinanceService;
import com.teducare.finance.PaystackLinkRequest;
import com.teducare.finance.PaystackLinkResponse;
import com.teducare.finance.PaystackSettingsResponse;
import com.teducare.finance.StudentLedgerLineResponse;
import com.teducare.programlevel.ProgramLevel;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.registration.CourseRegistrationResponse;
import com.teducare.registration.CourseRegistrationService;
import com.teducare.student.Student;
import com.teducare.student.StudentService;

/**
 * The Student Portal's own data endpoints — deliberately thin wrappers
 * around the same services the admin side already uses
 * (CourseResultService, CourseRegistrationService, FinanceService), each
 * re-scoped to exactly one student (the caller's own, from
 * {@link com.teducare.studentauth.CurrentStudentResolver}). Never a second
 * source of truth for academic/financial data.
 */
@Service
public class StudentPortalService {

    private final StudentService studentService;
    private final CourseResultService courseResultService;
    private final CourseRegistrationService courseRegistrationService;
    private final CourseService courseService;
    private final AcademicSemesterService academicSemesterService;
    private final AcademicSessionService academicSessionService;
    private final DepartmentService departmentService;
    private final ProgramLevelService programLevelService;
    private final FinanceService financeService;

    public StudentPortalService(
            StudentService studentService,
            CourseResultService courseResultService,
            CourseRegistrationService courseRegistrationService,
            CourseService courseService,
            AcademicSemesterService academicSemesterService,
            AcademicSessionService academicSessionService,
            DepartmentService departmentService,
            ProgramLevelService programLevelService,
            FinanceService financeService) {
        this.studentService = studentService;
        this.courseResultService = courseResultService;
        this.courseRegistrationService = courseRegistrationService;
        this.courseService = courseService;
        this.academicSemesterService = academicSemesterService;
        this.academicSessionService = academicSessionService;
        this.departmentService = departmentService;
        this.programLevelService = programLevelService;
        this.financeService = financeService;
    }

    public StudentAcademicSummaryResponse academicSummary(String institutionId, String studentId) {
        Student student = studentService.requireOwnStudent(institutionId, studentId);
        Department department = departmentService.requireOwnDepartment(institutionId, student.getDepartmentId());
        ProgramLevel level = programLevelService.requireOwnProgramLevel(institutionId, student.getProgramLevelId());
        AcademicSession session = academicSessionService.requireOwnSession(institutionId, student.getCurrentSessionId());

        CgpaResponse cgpaResponse = courseResultService.cgpa(institutionId, studentId);
        Optional<AcademicSemesterResponse> current = academicSemesterService.current(institutionId);

        List<RegisteredCourseResponse> courses = List.of();
        int registeredUnits = 0;
        String currentSemesterId = null;
        String currentSemesterName = null;
        int currentRegisteredCourseCount = 0;

        if (current.isPresent()) {
            AcademicSemesterResponse semester = current.get();
            currentSemesterId = semester.id();
            currentSemesterName = semester.name();
            List<CourseRegistrationResponse> registrations =
                    courseRegistrationService.list(institutionId, studentId, semester.id());
            currentRegisteredCourseCount = registrations.size();

            courses = registrations.stream()
                    .map(reg -> {
                        Course course = courseService.requireOwnCourse(institutionId, reg.courseId());
                        return new RegisteredCourseResponse(
                                course.getId(), course.getCode(), course.getName(), reg.unitSnapshot(), reg.isCarryover());
                    })
                    .toList();
            registeredUnits = registrations.stream().mapToInt(CourseRegistrationResponse::unitSnapshot).sum();
        }

        List<SemesterResultSummaryResponse> resultsBySemester = buildResultsBySemester(
                institutionId, cgpaResponse, currentSemesterId, currentRegisteredCourseCount);

        return new StudentAcademicSummaryResponse(
                department.getName(),
                level.getLevelCode(),
                session.getSession(),
                cgpaResponse.cgpa(),
                classify(cgpaResponse.cgpa()),
                currentSemesterId,
                currentSemesterName,
                courses,
                registeredUnits,
                resultsBySemester);
    }

    /** Chronological order (oldest first), each card's {@code cumulativeCgpa} a running weighted average up to and including that semester — never the student's final overall CGPA repeated on every card. */
    private List<SemesterResultSummaryResponse> buildResultsBySemester(
            String institutionId, CgpaResponse cgpaResponse, String currentSemesterId, int currentRegisteredCourseCount) {
        record Entry(AcademicSemester semester, GpaResponse gpa) {
        }

        List<Entry> entries = cgpaResponse.bySemester().stream()
                .map(g -> new Entry(academicSemesterService.requireOwnSemester(institutionId, g.academicSemesterId()), g))
                .sorted(Comparator.comparing(e -> e.semester().getFrom()))
                .toList();

        Map<String, String> sessionLabelCache = new java.util.HashMap<>();

        BigDecimal runningPoints = BigDecimal.ZERO;
        int runningUnits = 0;
        List<SemesterResultSummaryResponse> result = new java.util.ArrayList<>();
        for (Entry entry : entries) {
            String sessionLabel = sessionLabelCache.computeIfAbsent(entry.semester().getSessionId(),
                    sessionId -> academicSessionService.requireOwnSession(institutionId, sessionId).getSession());

            if (entry.gpa().gpa() != null) {
                runningPoints = runningPoints.add(
                        BigDecimal.valueOf(entry.gpa().gpa()).multiply(BigDecimal.valueOf(entry.gpa().totalUnits())));
                runningUnits += entry.gpa().totalUnits();
            }
            Double cumulative = runningUnits == 0 ? null
                    : runningPoints.divide(BigDecimal.valueOf(runningUnits), 2, RoundingMode.HALF_UP).doubleValue();

            boolean isCurrent = entry.semester().getId().equals(currentSemesterId);
            Integer stillToCome = null;
            if (isCurrent) {
                int remaining = currentRegisteredCourseCount - entry.gpa().courseCount();
                stillToCome = remaining > 0 ? remaining : null;
            }

            result.add(new SemesterResultSummaryResponse(
                    entry.semester().getId(),
                    entry.semester().getName(),
                    sessionLabel,
                    entry.gpa().gpa(),
                    isCurrent,
                    entry.gpa().courseCount(),
                    entry.gpa().totalUnits(),
                    cumulative,
                    stillToCome));
        }
        return result;
    }

    /** Standard 5.0-scale Nigerian university classification band — null when there's no CGPA yet. */
    private static String classify(Double cgpa) {
        if (cgpa == null) {
            return null;
        }
        if (cgpa >= 4.50) return "First Class";
        if (cgpa >= 3.50) return "Second Class Upper";
        if (cgpa >= 2.40) return "Second Class Lower";
        if (cgpa >= 1.50) return "Third Class";
        if (cgpa >= 1.00) return "Pass";
        return "Probation";
    }

    public StudentHostelStatusResponse hostelStatus(String institutionId, String studentId) {
        Student student = studentService.requireOwnStudent(institutionId, studentId);
        return new StudentHostelStatusResponse(student.getHostelName(), student.getRoomNumber());
    }

    public StudentBillsResponse bills(String institutionId, String studentId) {
        List<StudentLedgerLineResponse> ledger = financeService.ledger(institutionId, studentId);

        BigDecimal totalBilled = ledger.stream().map(StudentLedgerLineResponse::charge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = ledger.stream()
                .map(line -> line.payment() == null ? BigDecimal.ZERO : line.payment())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal balance = ledger.isEmpty() ? BigDecimal.ZERO : ledger.get(ledger.size() - 1).runningBalance();
        String status = balance.compareTo(BigDecimal.ZERO) <= 0 ? "PAID" : "OWING";

        PaystackSettingsResponse settings = financeService.getPaystackSettings(institutionId);

        return new StudentBillsResponse(totalBilled, totalPaid, balance, status, settings.enabled(), ledger);
    }

    public PaystackLinkResponse initiatePayment(String institutionId, String studentId, PaystackLinkRequest request) {
        return financeService.initiatePaystackPayment(institutionId, studentId, request);
    }
}
