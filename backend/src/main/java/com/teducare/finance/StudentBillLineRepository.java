package com.teducare.finance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentBillLineRepository extends JpaRepository<StudentBillLine, String> {

    List<StudentBillLine> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    List<StudentBillLine> findByInstitutionIdAndStudentIdOrderByDueDateAsc(String institutionId, String studentId);

    List<StudentBillLine> findByInstitutionIdAndFeeTypeId(String institutionId, String feeTypeId);

    Optional<StudentBillLine> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndStudentIdAndFeeTypeIdAndLineType(
            String institutionId, String studentId, String feeTypeId, String lineType);

    Optional<StudentBillLine> findByInstitutionIdAndParentLineIdAndLineType(
            String institutionId, String parentLineId, String lineType);
}
