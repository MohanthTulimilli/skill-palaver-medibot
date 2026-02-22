package com.medibots.controller;

import com.medibots.repository.AiLogRepository;
import com.medibots.repository.ClaimRepository;
import com.medibots.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ClaimRepository claimRepo;
    private final InvoiceRepository invoiceRepo;
    private final AiLogRepository aiLogRepo;

    public DashboardController(ClaimRepository claimRepo, InvoiceRepository invoiceRepo, AiLogRepository aiLogRepo) {
        this.claimRepo = claimRepo;
        this.invoiceRepo = invoiceRepo;
        this.aiLogRepo = aiLogRepo;
    }

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> kpis() {
        var claims = claimRepo.findAll();
        var invoices = invoiceRepo.findAll();
        var aiLogs = aiLogRepo.findAll();
        long totalClaims = claims.size();
        long approved = claims.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
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
        Map<String, Object> m = new HashMap<>();
        m.put("totalClaims", totalClaims);
        m.put("approvedClaims", approved);
        m.put("denialRate", denialRate);
        m.put("revenueCollected", revenueCollected);
        m.put("aiAccuracy", aiAccuracy);
        return ResponseEntity.ok(m);
    }

    @GetMapping("/claims-per-day")
    public ResponseEntity<List<Map<String, Object>>> claimsPerDay() {
        var claims = claimRepo.findAllByOrderByCreatedAtDesc();
        String[] days = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String d : days) counts.put(d, 0L);
        claims.forEach(c -> {
            if (c.getSubmittedAt() != null) {
                int day = c.getSubmittedAt().atZone(java.time.ZoneId.systemDefault()).getDayOfWeek().getValue() % 7;
                String name = days[day];
                counts.put(name, counts.get(name) + 1);
            }
        });
        List<Map<String, Object>> out = counts.entrySet().stream()
                .map(e -> Map.<String, Object>of("name", e.getKey(), "value", e.getValue().intValue()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<Map<String, Object>>> revenueTrend() {
        var invoices = invoiceRepo.findAll().stream()
                .filter(i -> "PAID".equals(i.getPaymentStatus()))
                .collect(Collectors.toList());
        Map<String, Double> byMonth = new TreeMap<>();
        invoices.forEach(i -> {
            if (i.getCreatedAt() != null) {
                String month = i.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).getMonth().toString().substring(0, 3);
                byMonth.merge(month, i.getTotalAmount().doubleValue(), Double::sum);
            }
        });
        List<Map<String, Object>> out = byMonth.entrySet().stream()
                .map(e -> (Map<String, Object>) new HashMap<String, Object>(Map.of("name", e.getKey(), "value", e.getValue())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/denial-distribution")
    public ResponseEntity<List<Map<String, Object>>> denialDistribution() {
        var claims = claimRepo.findAll().stream().filter(c -> "DENIED".equals(c.getStatus())).collect(Collectors.toList());
        Map<String, Integer> cat = new HashMap<>();
        cat.put("Coding Issues", 0);
        cat.put("Missing Auth", 0);
        cat.put("High Risk", 0);
        cat.put("Other", 0);
        for (var c : claims) {
            String exp = (c.getAiExplanation() != null ? c.getAiExplanation() : "").toLowerCase();
            if (exp.contains("coding") || exp.contains("mismatch")) cat.merge("Coding Issues", 1, Integer::sum);
            else if (exp.contains("auth") || exp.contains("incomplete")) cat.merge("Missing Auth", 1, Integer::sum);
            else if (exp.contains("high risk") || exp.contains("flagged")) cat.merge("High Risk", 1, Integer::sum);
            else cat.merge("Other", 1, Integer::sum);
        }
        List<Map<String, Object>> out = cat.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .map(e -> (Map<String, Object>) new HashMap<String, Object>(Map.of("name", e.getKey(), "value", e.getValue())))
                .collect(Collectors.toList());
        if (out.isEmpty()) out.add(Map.of("name", "No Denials", "value", 1));
        return ResponseEntity.ok(out);
    }

    @GetMapping("/claims-by-payer")
    public ResponseEntity<List<Map<String, Object>>> claimsByPayer() {
        var claims = claimRepo.findAll();
        Map<String, Long> byProvider = claims.stream().collect(Collectors.groupingBy(c -> c.getInsuranceProvider() != null ? c.getInsuranceProvider() : "Unknown", Collectors.counting()));
        List<Map<String, Object>> out = byProvider.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> (Map<String, Object>) new HashMap<String, Object>(Map.of("name", e.getKey(), "value", e.getValue().intValue())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }
}
