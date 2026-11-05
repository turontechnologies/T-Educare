package com.teducare.finance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceTransactionLogRepository extends JpaRepository<FinanceTransactionLog, String> {

    List<FinanceTransactionLog> findByInstitutionIdOrderByCreatedAtDesc(String institutionId);
}
