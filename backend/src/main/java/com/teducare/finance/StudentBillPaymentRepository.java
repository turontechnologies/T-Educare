package com.teducare.finance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentBillPaymentRepository extends JpaRepository<StudentBillPayment, String> {

    List<StudentBillPayment> findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(String institutionId, String studentId);

    List<StudentBillPayment> findByInstitutionIdAndBillLineIdOrderByCreatedAtAsc(String institutionId, String billLineId);

    List<StudentBillPayment> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);
}
