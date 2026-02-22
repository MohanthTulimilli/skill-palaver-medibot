package com.medibots.repository;

import com.medibots.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByInvoiceId(String invoiceId);
}
