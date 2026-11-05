package com.teducare.finance;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRunRepository extends JpaRepository<PayrollRun, String> {

    Optional<PayrollRun> findByInstitutionIdAndPeriodYearAndPeriodMonth(
            String institutionId, int periodYear, int periodMonth);
}
