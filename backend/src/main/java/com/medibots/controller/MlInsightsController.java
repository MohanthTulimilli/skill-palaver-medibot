package com.medibots.controller;

import com.medibots.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ML stats and prediction-with-insights API for Claims, Invoices, and Appointments.
 * Exposes historical acceptance/denial rates and Grok-powered predictions.
 */
@RestController
@RequestMapping("/api/ml")
public class MlInsightsController {
    private final MlPredictionService mlService;

    public MlInsightsController(MlPredictionService mlService) {
        this.mlService = mlService;
    }

    @GetMapping("/stats/claims")
    public ResponseEntity<Map<String, Object>> claimsStats() {
        return ResponseEntity.ok(mlService.fetchClaimsStats());
    }

    @GetMapping("/stats/invoices")
    public ResponseEntity<Map<String, Object>> invoicesStats() {
        return ResponseEntity.ok(mlService.fetchInvoiceStats());
    }

    @GetMapping("/stats/appointments")
    public ResponseEntity<Map<String, Object>> appointmentsStats() {
        return ResponseEntity.ok(mlService.fetchAppointmentStats());
    }

    @PostMapping("/predict/claim")
    public ResponseEntity<Map<String, Object>> predictClaim(@RequestBody Map<String, Object> features) {
        return ResponseEntity.ok(mlService.predictClaimWithInsights(features));
    }

    @PostMapping("/predict/invoice")
    public ResponseEntity<Map<String, Object>> predictInvoice(@RequestBody Map<String, Object> features) {
        return ResponseEntity.ok(mlService.predictInvoiceWithInsights(features));
    }

    @PostMapping("/predict/appointment")
    public ResponseEntity<Map<String, Object>> predictAppointment(@RequestBody Map<String, Object> features) {
        return ResponseEntity.ok(mlService.predictAppointmentWithInsights(features));
    }
}
