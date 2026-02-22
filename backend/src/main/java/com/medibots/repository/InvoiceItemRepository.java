package com.medibots.repository;

import com.medibots.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, String> {
    List<InvoiceItem> findByInvoiceIdOrderByCreatedAtAsc(String invoiceId);
}
