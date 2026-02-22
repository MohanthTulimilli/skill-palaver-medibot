package com.medibots.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medibots.entity.Invoice;
import com.medibots.entity.Patient;
import com.medibots.entity.Payment;
import com.medibots.entity.Profile;
import com.medibots.repository.InvoiceRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.repository.PaymentRepository;
import com.medibots.repository.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
public class PatientsController {
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PatientsController(PatientRepository patientRepo, ProfileRepository profileRepo,
                              InvoiceRepository invoiceRepo, PaymentRepository paymentRepo) {
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
        this.invoiceRepo = invoiceRepo;
        this.paymentRepo = paymentRepo;
    }

    @GetMapping
    public ResponseEntity<List<Patient>> list() {
        return ResponseEntity.ok(patientRepo.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        return patient.isPresent() ? ResponseEntity.ok(patient.get()) : ResponseEntity.ok(new HashMap<>());
    }

    /** List patients pending approval for the admin's hospital. */
    @GetMapping("/pending")
    public ResponseEntity<List<Patient>> pending(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hospitalId = profileRepo.findByUserId(auth.getName())
                .map(Profile::getHospitalId)
                .orElse(null);
        if (hospitalId == null || hospitalId.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(patientRepo.findByHospitalIdAndOnboardingStatusOrderByCreatedAtDesc(hospitalId, "PENDING_APPROVAL"));
    }

    /** Get patient's count of previous late payments (payment_date > invoice due_date). */
    @GetMapping("/{id}/late-payment-count")
    public ResponseEntity<Map<String, Object>> latePaymentCount(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (!patientRepo.existsById(id)) return ResponseEntity.notFound().build();
        int count = 0;
        for (Invoice inv : invoiceRepo.findByPatientIdOrderByCreatedAtDesc(id)) {
            if (!"PAID".equals(inv.getPaymentStatus())) continue;
            for (Payment pmt : paymentRepo.findByInvoiceId(inv.getId())) {
                if (pmt.getPaymentDate() != null && inv.getDueDate() != null
                        && pmt.getPaymentDate().isAfter(inv.getDueDate())) {
                    count++;
                    break;
                }
            }
        }
        return ResponseEntity.ok(Map.of("patient_id", id, "previous_late_payments", count));
    }

    /** Get patient detail for admin review (documents + validation report). */
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return patientRepo.findById(id)
                .map(p -> ResponseEntity.ok(p))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String userId = auth.getName();
        Patient p = new Patient();
        p.setUserId(userId);
        p.setFullName((String) body.get("full_name"));
        if (body.get("dob") != null) p.setDob(LocalDate.parse(body.get("dob").toString()));
        p.setGender((String) body.get("gender"));
        p.setInsuranceProvider((String) body.get("insurance_provider"));
        p.setPolicyNumber((String) body.get("policy_number"));
        if (body.get("hospital_id") != null) p.setHospitalId((String) body.get("hospital_id"));
        if (body.get("photo_id_path") != null) p.setPhotoIdPath((String) body.get("photo_id_path"));
        if (body.get("insurance_card_path") != null) p.setInsuranceCardPath((String) body.get("insurance_card_path"));
        p.setOnboardingStatus("PENDING_APPROVAL");
        if (body.get("validation_report") != null) {
            try {
                p.setValidationReportJson(objectMapper.writeValueAsString(body.get("validation_report")));
            } catch (JsonProcessingException ignored) {}
        }
        p = patientRepo.save(p);
        if (body.get("hospital_id") != null) {
            profileRepo.findByUserId(userId).ifPresent(pr -> {
                pr.setHospitalId((String) body.get("hospital_id"));
                profileRepo.save(pr);
            });
        }
        return ResponseEntity.ok(p);
    }

    /** Admin approves patient onboarding. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Patient> approve(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hospitalId = profileRepo.findByUserId(auth.getName()).map(Profile::getHospitalId).orElse(null);
        if (hospitalId == null || hospitalId.isBlank()) {
            return ResponseEntity.status(403).build();
        }
        return patientRepo.findById(id)
                .filter(p -> hospitalId.equals(p.getHospitalId()))
                .map(p -> {
                    p.setOnboardingStatus("APPROVED");
                    return ResponseEntity.ok(patientRepo.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Patient updates their own profile (personal info, insurance, documents) when PENDING_APPROVAL or APPROVED. */
    @PatchMapping("/me")
    public ResponseEntity<Patient> updateMyProfile(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String userId = auth.getName();
        return patientRepo.findByUserId(userId)
                .filter(p -> "PENDING_APPROVAL".equals(p.getOnboardingStatus()) || "APPROVED".equals(p.getOnboardingStatus()))
                .map(p -> {
                    if (body.get("full_name") != null) p.setFullName((String) body.get("full_name"));
                    if (body.get("dob") != null) p.setDob(LocalDate.parse(body.get("dob").toString()));
                    if (body.get("gender") != null) p.setGender((String) body.get("gender"));
                    if (body.get("insurance_provider") != null) p.setInsuranceProvider((String) body.get("insurance_provider"));
                    if (body.get("policy_number") != null) p.setPolicyNumber((String) body.get("policy_number"));
                    if (body.get("hospital_id") != null) {
                        p.setHospitalId((String) body.get("hospital_id"));
                        profileRepo.findByUserId(userId).ifPresent(pr -> {
                            pr.setHospitalId((String) body.get("hospital_id"));
                            profileRepo.save(pr);
                        });
                    }
                    if (body.get("photo_id_path") != null) p.setPhotoIdPath((String) body.get("photo_id_path"));
                    if (body.get("insurance_card_path") != null) p.setInsuranceCardPath((String) body.get("insurance_card_path"));
                    if (body.get("validation_report") != null) {
                        try {
                            p.setValidationReportJson(objectMapper.writeValueAsString(body.get("validation_report")));
                        } catch (JsonProcessingException ignored) {}
                    }
                    return ResponseEntity.ok(patientRepo.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Admin rejects patient onboarding. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Patient> reject(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hospitalId = profileRepo.findByUserId(auth.getName()).map(Profile::getHospitalId).orElse(null);
        if (hospitalId == null || hospitalId.isBlank()) {
            return ResponseEntity.status(403).build();
        }
        return patientRepo.findById(id)
                .filter(p -> hospitalId.equals(p.getHospitalId()))
                .map(p -> {
                    p.setOnboardingStatus("REJECTED");
                    return ResponseEntity.ok(patientRepo.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
