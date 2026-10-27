package com.teducare.courseresult;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ResultsGracePeriodRepository extends JpaRepository<ResultsGracePeriod, String> {

    Optional<ResultsGracePeriod> findByInstitutionId(String institutionId);
}
