package com.medibots.repository;

import com.medibots.entity.InvoiceFeatures;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceFeaturesRepository extends JpaRepository<InvoiceFeatures, String> {
    Optional<InvoiceFeatures> findByInvoiceId(String invoiceId);
}
