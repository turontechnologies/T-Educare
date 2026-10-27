package com.teducare.courseresult;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MarkingGuideComponentRepository extends JpaRepository<MarkingGuideComponent, String> {

    List<MarkingGuideComponent> findByInstitutionIdOrderByDisplayOrderAsc(String institutionId);

    void deleteByInstitutionId(String institutionId);
}
