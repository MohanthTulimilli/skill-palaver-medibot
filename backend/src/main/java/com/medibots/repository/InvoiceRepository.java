package com.medibots.repository;

import com.medibots.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    List<Invoice> findAllByOrderByCreatedAtDesc();
    List<Invoice> findByPatientIdOrderByCreatedAtDesc(String patientId);
}
