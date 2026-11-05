package com.teducare.finance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PayslipRepository extends JpaRepository<Payslip, String> {

    List<Payslip> findByInstitutionIdAndPeriodYearAndPeriodMonth(String institutionId, int periodYear, int periodMonth);

    Optional<Payslip> findByInstitutionIdAndStaffIdAndPeriodYearAndPeriodMonth(
            String institutionId, String staffId, int periodYear, int periodMonth);

    List<Payslip> findByInstitutionIdAndStaffIdOrderByPeriodYearDescPeriodMonthDesc(String institutionId, String staffId);
}
