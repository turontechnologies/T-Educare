package com.teducare.courseresult;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MarkingGuideRepository extends JpaRepository<MarkingGuide, String> {

    Optional<MarkingGuide> findByInstitutionId(String institutionId);
}
