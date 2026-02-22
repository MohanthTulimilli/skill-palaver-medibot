package com.medibots.controller;

import com.medibots.entity.Invoice;
import com.medibots.entity.Payment;
import com.medibots.repository.InvoiceRepository;
import com.medibots.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
public class PaymentsController {
    private final PaymentRepository paymentRepo;
    private final InvoiceRepository invoiceRepo;

    public PaymentsController(PaymentRepository paymentRepo, InvoiceRepository invoiceRepo) {
        this.paymentRepo = paymentRepo;
        this.invoiceRepo = invoiceRepo;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        List<Payment> all = paymentRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> out = all.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<Payment> create(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Payment p = new Payment();
        p.setInvoiceId((String) body.get("invoice_id"));
        p.setAmountPaid(body.get("amount_paid") != null ? new BigDecimal(body.get("amount_paid").toString()) : BigDecimal.ZERO);
        p.setPaymentMethod((String) body.get("payment_method"));
        p.setPaidBy(auth.getName());
        p.setTransactionId(body.get("transaction_id") != null ? body.get("transaction_id").toString() : "TXN-" + System.currentTimeMillis());
        p = paymentRepo.save(p);
        invoiceRepo.findById(p.getInvoiceId()).ifPresent(inv -> {
            inv.setPaymentStatus("PAID");
            invoiceRepo.save(inv);
        });
        return ResponseEntity.ok(p);
    }

    private Map<String, Object> toMap(Payment p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("invoice_id", p.getInvoiceId());
        m.put("amount_paid", p.getAmountPaid());
        m.put("payment_method", p.getPaymentMethod());
        m.put("payment_date", p.getPaymentDate());
        m.put("transaction_id", p.getTransactionId());
        m.put("paid_by", p.getPaidBy());
        m.put("created_at", p.getCreatedAt());
        return m;
    }
}
