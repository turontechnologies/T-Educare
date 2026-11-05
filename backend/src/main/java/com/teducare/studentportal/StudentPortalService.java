package com.teducare.studentportal;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.teducare.academics.AcademicSemesterResponse;
import com.teducare.academics.AcademicSemesterService;
import com.teducare.course.Course;
import com.teducare.course.CourseService;
import com.teducare.courseresult.CgpaResponse;
import com.teducare.courseresult.CourseResultService;
import com.teducare.finance.FinanceService;
import com.teducare.finance.PaystackLinkRequest;
import com.teducare.finance.PaystackLinkResponse;
import com.teducare.finance.PaystackSettingsResponse;
import com.teducare.finance.StudentLedgerLineResponse;
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
    private final FinanceService financeService;

    public StudentPortalService(
            StudentService studentService,
            CourseResultService courseResultService,
            CourseRegistrationService courseRegistrationService,
            CourseService courseService,
            AcademicSemesterService academicSemesterService,
            FinanceService financeService) {
        this.studentService = studentService;
        this.courseResultService = courseResultService;
        this.courseRegistrationService = courseRegistrationService;
        this.courseService = courseService;
        this.academicSemesterService = academicSemesterService;
        this.financeService = financeService;
    }

    public StudentAcademicSummaryResponse academicSummary(String institutionId, String studentId) {
        CgpaResponse cgpaResponse = courseResultService.cgpa(institutionId, studentId);
        Optional<AcademicSemesterResponse> current = academicSemesterService.current(institutionId);

        if (current.isEmpty()) {
            return new StudentAcademicSummaryResponse(cgpaResponse.cgpa(), null, null, List.of(), 0);
        }

        AcademicSemesterResponse semester = current.get();
        List<CourseRegistrationResponse> registrations =
                courseRegistrationService.list(institutionId, studentId, semester.id());

        List<RegisteredCourseResponse> courses = registrations.stream()
                .map(reg -> {
                    Course course = courseService.requireOwnCourse(institutionId, reg.courseId());
                    return new RegisteredCourseResponse(
                            course.getId(), course.getCode(), course.getName(), reg.unitSnapshot(), reg.isCarryover());
                })
                .toList();
        int totalUnits = registrations.stream().mapToInt(CourseRegistrationResponse::unitSnapshot).sum();

        return new StudentAcademicSummaryResponse(
                cgpaResponse.cgpa(), semester.id(), semester.name(), courses, totalUnits);
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
