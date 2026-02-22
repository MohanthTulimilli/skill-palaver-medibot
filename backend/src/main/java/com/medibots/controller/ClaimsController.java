package com.medibots.controller;

import com.medibots.entity.Claim;
import com.medibots.entity.ClaimFeatures;
import com.medibots.entity.Patient;
import com.medibots.repository.ClaimFeaturesRepository;
import com.medibots.repository.ClaimRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
public class ClaimsController {
    private final ClaimRepository claimRepo;
    private final PatientRepository patientRepo;
    private final ClaimFeaturesRepository claimFeaturesRepo;
    private final MlPredictionService mlService;

    public ClaimsController(ClaimRepository claimRepo, PatientRepository patientRepo,
                            ClaimFeaturesRepository claimFeaturesRepo, MlPredictionService mlService) {
        this.claimRepo = claimRepo;
        this.patientRepo = patientRepo;
        this.claimFeaturesRepo = claimFeaturesRepo;
        this.mlService = mlService;
    }

    private String userId(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth) {
        List<Claim> claims = claimRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Claim c : claims) {
            Map<String, Object> m = toMap(c);
            claimFeaturesRepo.findByClaimId(c.getId()).ifPresent(f -> addPredictionToMap(m, f));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientClaims(Authentication auth) {
        String uid = userId(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        Patient p = patientRepo.findByUserId(uid).orElse(null);
        if (p == null) return ResponseEntity.ok(List.of());
        List<Claim> claims = claimRepo.findByPatientIdOrderByCreatedAtDesc(p.getId());
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Claim c : claims) {
            Map<String, Object> m = toMap(c);
            claimFeaturesRepo.findByClaimId(c.getId()).ifPresent(f -> addPredictionToMap(m, f));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body, Authentication auth) {
        String uid = userId(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        Claim c = new Claim();
        c.setPatientId((String) body.get("patient_id"));
        c.setInsuranceProvider((String) body.get("insurance_provider"));
        c.setAmount(body.get("amount") != null ? new BigDecimal(body.get("amount").toString()) : BigDecimal.ZERO);
        c.setSubmittedBy(uid);
        if (body.get("appointment_id") != null) c.setAppointmentId((String) body.get("appointment_id"));
        if (body.get("hospital_id") != null) c.setHospitalId((String) body.get("hospital_id"));
        applyClaimExtras(c, body);
        c = claimRepo.save(c);
        Map<String, Object> features = claimToFeaturesMap(c);
        MlPredictionService.PredictionResult pred = mlService.predictDenial(features);
        c.setAiRiskScore(java.math.BigDecimal.valueOf(pred.probability() * 100));
        c = claimRepo.save(c);
        ClaimFeatures cf = claimFeaturesRepo.findByClaimId(c.getId()).orElse(new ClaimFeatures());
        cf.setClaimId(c.getId());
        cf.setRiskScoreNormalized(java.math.BigDecimal.valueOf(pred.probability()));
        cf.setMlPrediction(pred.prediction());
        cf.setMlProbability(java.math.BigDecimal.valueOf(pred.probability()));
        claimFeaturesRepo.save(cf);
        Map<String, Object> out = toMap(c);
        addPredictionToMap(out, cf);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/rescore")
    public ResponseEntity<Map<String, Object>> rescoreAll(Authentication auth) {
        List<Claim> claims = claimRepo.findAllByOrderByCreatedAtDesc();
        int updated = 0;
        for (Claim c : claims) {
            Map<String, Object> features = claimToFeaturesMap(c);
            MlPredictionService.PredictionResult pred = mlService.predictDenial(features);
            BigDecimal newScore = java.math.BigDecimal.valueOf(pred.probability() * 100);
            c.setAiRiskScore(newScore);
            claimRepo.save(c);
            ClaimFeatures cf = claimFeaturesRepo.findByClaimId(c.getId()).orElse(new ClaimFeatures());
            cf.setClaimId(c.getId());
            cf.setRiskScoreNormalized(java.math.BigDecimal.valueOf(pred.probability()));
            cf.setMlPrediction(pred.prediction());
            cf.setMlProbability(java.math.BigDecimal.valueOf(pred.probability()));
            claimFeaturesRepo.save(cf);
            updated++;
        }
        return ResponseEntity.ok(Map.of("rescored", updated, "total", claims.size()));
    }

    @PostMapping("/manage")
    public ResponseEntity<Map<String, Object>> manage(@RequestBody Map<String, String> body, Authentication auth) {
        String claimId = body.get("claim_id");
        String action = body.get("action");
        Claim c = claimRepo.findById(claimId).orElseThrow(() -> new RuntimeException("Claim not found"));
        if ("approve".equals(action)) c.setStatus("APPROVED");
        else if ("reject".equals(action)) c.setStatus("DENIED");
        c.setProcessedAt(Instant.now());
        c = claimRepo.save(c);
        return ResponseEntity.ok(toMap(c));
    }

    private void applyClaimExtras(Claim c, Map<String, Object> body) {
        if (body.get("primary_icd_code") != null) c.setPrimaryIcdCode((String) body.get("primary_icd_code"));
        if (body.get("secondary_icd_code") != null) c.setSecondaryIcdCode((String) body.get("secondary_icd_code"));
        if (body.get("cpt_code") != null) c.setCptCode((String) body.get("cpt_code"));
        if (body.get("procedure_category") != null) c.setProcedureCategory((String) body.get("procedure_category"));
        if (body.get("medical_necessity_score") != null) c.setMedicalNecessityScore(intFrom(body.get("medical_necessity_score")));
        if (body.get("prior_denial_count") != null) c.setPriorDenialCount(intFrom(body.get("prior_denial_count")));
        if (body.get("resubmission_count") != null) c.setResubmissionCount(intFrom(body.get("resubmission_count")));
        if (body.get("days_to_submission") != null) c.setDaysToSubmission(intFrom(body.get("days_to_submission")));
        if (body.get("documentation_complete") != null) c.setDocumentationComplete(Boolean.TRUE.equals(body.get("documentation_complete")));
        if (body.get("claim_type") != null) c.setClaimType((String) body.get("claim_type"));
        if (body.get("policy_type") != null) c.setPolicyType((String) body.get("policy_type"));
        if (body.get("coverage_limit") != null) c.setCoverageLimit(new BigDecimal(body.get("coverage_limit").toString()));
        if (body.get("deductible_amount") != null) c.setDeductibleAmount(new BigDecimal(body.get("deductible_amount").toString()));
        if (body.get("preauthorization_required") != null) c.setPreauthorizationRequired(Boolean.TRUE.equals(body.get("preauthorization_required")));
        if (body.get("preauthorization_obtained") != null) c.setPreauthorizationObtained(Boolean.TRUE.equals(body.get("preauthorization_obtained")));
        if (body.get("patient_age") != null) c.setPatientAge(intFrom(body.get("patient_age")));
        if (body.get("patient_gender") != null) c.setPatientGender((String) body.get("patient_gender"));
        if (body.get("chronic_condition_flag") != null) c.setChronicConditionFlag(Boolean.TRUE.equals(body.get("chronic_condition_flag")));
        if (body.get("doctor_specialization") != null) c.setDoctorSpecialization((String) body.get("doctor_specialization"));
        if (body.get("hospital_tier") != null) c.setHospitalTier((String) body.get("hospital_tier"));
        if (body.get("hospital_claim_success_rate") != null) c.setHospitalClaimSuccessRate(new BigDecimal(body.get("hospital_claim_success_rate").toString()));
    }

    private static Integer intFrom(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        return Integer.parseInt(o.toString());
    }

    private Map<String, Object> claimToFeaturesMap(Claim c) {
        Map<String, Object> m = new HashMap<>();
        m.put("amount", c.getAmount());
        m.put("coverage_limit", c.getCoverageLimit());
        m.put("deductible_amount", c.getDeductibleAmount());
        m.put("insurance_provider", c.getInsuranceProvider());
        m.put("policy_type", c.getPolicyType());
        m.put("preauthorization_required", c.getPreauthorizationRequired());
        m.put("preauthorization_obtained", c.getPreauthorizationObtained());
        m.put("primary_icd_code", c.getPrimaryIcdCode());
        m.put("secondary_icd_code", c.getSecondaryIcdCode());
        m.put("cpt_code", c.getCptCode());
        m.put("procedure_category", c.getProcedureCategory());
        m.put("medical_necessity_score", c.getMedicalNecessityScore());
        m.put("prior_denial_count", c.getPriorDenialCount());
        m.put("resubmission_count", c.getResubmissionCount());
        m.put("days_to_submission", c.getDaysToSubmission());
        m.put("documentation_complete", c.getDocumentationComplete());
        m.put("claim_type", c.getClaimType());
        m.put("patient_age", c.getPatientAge());
        m.put("patient_gender", c.getPatientGender());
        m.put("chronic_condition_flag", c.getChronicConditionFlag());
        m.put("doctor_specialization", c.getDoctorSpecialization());
        m.put("hospital_tier", c.getHospitalTier());
        m.put("hospital_claim_success_rate", c.getHospitalClaimSuccessRate());
        return m;
    }

    private void addPredictionToMap(Map<String, Object> m, ClaimFeatures f) {
        if (f.getMlPrediction() != null) m.put("ml_denial_prediction", f.getMlPrediction());
        if (f.getMlProbability() != null) m.put("ml_denial_probability", f.getMlProbability().doubleValue());
    }

    private Map<String, Object> toMap(Claim c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("claim_number", c.getClaimNumber());
        m.put("patient_id", c.getPatientId());
        m.put("insurance_provider", c.getInsuranceProvider());
        m.put("amount", c.getAmount());
        m.put("status", c.getStatus());
        m.put("ai_risk_score", c.getAiRiskScore());
        m.put("ai_explanation", c.getAiExplanation());
        m.put("submitted_by", c.getSubmittedBy());
        m.put("submitted_at", c.getSubmittedAt());
        m.put("processed_at", c.getProcessedAt());
        m.put("appointment_id", c.getAppointmentId());
        m.put("hospital_id", c.getHospitalId());
        m.put("primary_icd_code", c.getPrimaryIcdCode());
        m.put("secondary_icd_code", c.getSecondaryIcdCode());
        m.put("cpt_code", c.getCptCode());
        m.put("procedure_category", c.getProcedureCategory());
        m.put("medical_necessity_score", c.getMedicalNecessityScore());
        m.put("prior_denial_count", c.getPriorDenialCount());
        m.put("resubmission_count", c.getResubmissionCount());
        m.put("days_to_submission", c.getDaysToSubmission());
        m.put("documentation_complete", c.getDocumentationComplete());
        m.put("claim_type", c.getClaimType());
        m.put("policy_type", c.getPolicyType());
        m.put("coverage_limit", c.getCoverageLimit());
        m.put("deductible_amount", c.getDeductibleAmount());
        m.put("preauthorization_required", c.getPreauthorizationRequired());
        m.put("preauthorization_obtained", c.getPreauthorizationObtained());
        m.put("patient_age", c.getPatientAge());
        m.put("patient_gender", c.getPatientGender());
        m.put("chronic_condition_flag", c.getChronicConditionFlag());
        m.put("doctor_specialization", c.getDoctorSpecialization());
        m.put("hospital_tier", c.getHospitalTier());
        m.put("hospital_claim_success_rate", c.getHospitalClaimSuccessRate());
        m.put("created_at", c.getCreatedAt());
        patientRepo.findById(c.getPatientId()).ifPresent(p -> {
            m.put("patients", Map.of("full_name", p.getFullName() != null ? p.getFullName() : "", "user_id", p.getUserId() != null ? p.getUserId() : ""));
        });
        return m;
    }
}
