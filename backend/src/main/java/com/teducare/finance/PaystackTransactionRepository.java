package com.teducare.finance;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaystackTransactionRepository extends JpaRepository<PaystackTransaction, String> {

    Optional<PaystackTransaction> findByReference(String reference);
}
