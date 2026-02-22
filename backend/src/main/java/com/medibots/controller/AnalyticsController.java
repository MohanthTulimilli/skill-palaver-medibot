package com.medibots.controller;

import com.medibots.repository.ClaimRepository;
import com.medibots.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final ClaimRepository claimRepo;
    private final InvoiceRepository invoiceRepo;

    public AnalyticsController(ClaimRepository claimRepo, InvoiceRepository invoiceRepo) {
        this.claimRepo = claimRepo;
        this.invoiceRepo = invoiceRepo;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> analytics() {
        Map<String, Object> m = new HashMap<>();
        m.put("totalClaims", claimRepo.count());
        m.put("totalInvoices", invoiceRepo.count());
        return ResponseEntity.ok(m);
    }
}
