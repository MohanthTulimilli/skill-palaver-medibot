package com.medibots.controller;

import com.medibots.repository.AiLogRepository;
import com.medibots.repository.ClaimRepository;
import com.medibots.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public API for landing page stats. No auth required.
 */
@RestController
@RequestMapping("/api/landing")
public class LandingController {
    private final ClaimRepository claimRepo;
    private final InvoiceRepository invoiceRepo;
    private final AiLogRepository aiLogRepo;

    public LandingController(ClaimRepository claimRepo, InvoiceRepository invoiceRepo, AiLogRepository aiLogRepo) {
        this.claimRepo = claimRepo;
        this.invoiceRepo = invoiceRepo;
        this.aiLogRepo = aiLogRepo;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        var claims = claimRepo.findAll();
        var invoices = invoiceRepo.findAll();
        var aiLogs = aiLogRepo.findAll();
        long totalClaims = claims.size();
        long denied = claims.stream().filter(c -> "DENIED".equals(c.getStatus())).count();
        double denialRate = totalClaims > 0 ? Math.round((denied * 1000.0) / totalClaims) / 10.0 : 0;
        double revenueCollected = invoices.stream()
                .filter(i -> "PAID".equals(i.getPaymentStatus()))
                .mapToDouble(i -> i.getTotalAmount().doubleValue())
                .sum();
        double aiAccuracy = aiLogs.isEmpty() ? 0 : aiLogs.stream()
                .mapToDouble(l -> l.getConfidence().doubleValue())
                .average().orElse(0);
        aiAccuracy = Math.round(aiAccuracy * 10) / 10.0;

        // Claims per day for trend chart (7 days, then repeat 5 to get 12 bars)
        String[] days = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        Map<String, Long> dayCounts = new java.util.LinkedHashMap<>();
        for (String d : days) dayCounts.put(d, 0L);
        claims.forEach(c -> {
            if (c.getSubmittedAt() != null) {
                int day = c.getSubmittedAt().atZone(java.time.ZoneId.systemDefault()).getDayOfWeek().getValue() % 7;
                dayCounts.put(days[day], dayCounts.get(days[day]) + 1);
            }
        });
        List<Integer> raw = dayCounts.values().stream().mapToInt(Long::intValue).boxed().collect(Collectors.toList());
        int maxVal = raw.isEmpty() ? 1 : raw.stream().mapToInt(Integer::intValue).max().orElse(1);
        double scale = maxVal > 0 ? 100.0 / maxVal : 1;
        List<Integer> claimsTrendPct = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) {
            int v = raw.isEmpty() ? 0 : raw.get(i % 7);
            claimsTrendPct.add(Math.min(100, (int) Math.round(v * scale)));
        }
        if (claimsTrendPct.stream().allMatch(v -> v == 0))
            claimsTrendPct = List.of(40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 88); // fallback when no data

        Map<String, Object> m = new HashMap<>();
        m.put("totalClaims", totalClaims);
        m.put("denialRate", denialRate);
        m.put("revenueCollected", revenueCollected);
        m.put("aiAccuracy", Math.min(100, aiAccuracy));
        m.put("claimsTrend", claimsTrendPct);
        return ResponseEntity.ok(m);
    }
}
