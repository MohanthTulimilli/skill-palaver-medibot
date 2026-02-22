package com.medibots.controller;

import com.medibots.entity.DoctorRecommendation;
import com.medibots.entity.Patient;
import com.medibots.entity.ServiceCatalog;
import com.medibots.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-recommendations")
public class DoctorRecommendationsController {
    private final DoctorRecommendationRepository recRepo;
    private final ServiceCatalogRepository catalogRepo;
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;

    public DoctorRecommendationsController(DoctorRecommendationRepository recRepo, ServiceCatalogRepository catalogRepo,
                                           PatientRepository patientRepo, ProfileRepository profileRepo) {
        this.recRepo = recRepo;
        this.catalogRepo = catalogRepo;
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        if (patient.isEmpty()) return ResponseEntity.ok(List.of());
        List<DoctorRecommendation> list = recRepo.findByPatientIdOrderByCreatedAtDesc(patient.get().getId());
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping("/by-patient")
    public ResponseEntity<List<Map<String, Object>>> byPatient(@RequestParam String patientId) {
        List<DoctorRecommendation> list = recRepo.findByPatientIdOrderByCreatedAtDesc(patientId);
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Map<String, Object>>> byAppointment(@PathVariable String appointmentId) {
        List<DoctorRecommendation> list = recRepo.findByAppointmentIdOrderByCreatedAtAsc(appointmentId);
        return ResponseEntity.ok(toMaps(list));
    }

    @PostMapping
    public ResponseEntity<DoctorRecommendation> create(Authentication auth, @RequestBody Map<String, Object> body) {
        DoctorRecommendation r = new DoctorRecommendation();
        r.setAppointmentId((String) body.get("appointment_id"));
        r.setPatientId((String) body.get("patient_id"));
        r.setDoctorId(auth != null ? auth.getName() : (String) body.get("doctor_id"));
        r.setServiceCatalogId((String) body.get("service_catalog_id"));
        r.setHospitalId((String) body.get("hospital_id"));
        r.setStatus("PENDING");
        if (body.get("notes") != null) r.setNotes((String) body.get("notes"));
        if (body.get("recommended_price") != null) r.setRecommendedPrice(new BigDecimal(body.get("recommended_price").toString()));
        return ResponseEntity.ok(recRepo.save(r));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DoctorRecommendation> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return recRepo.findById(id).map(r -> {
            if (body.get("status") != null) r.setStatus((String) body.get("status"));
            if (body.get("invoice_id") != null) r.setInvoiceId((String) body.get("invoice_id"));
            return ResponseEntity.ok(recRepo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<Map<String, Object>> toMaps(List<DoctorRecommendation> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (DoctorRecommendation r : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("appointment_id", r.getAppointmentId());
            m.put("patient_id", r.getPatientId());
            m.put("doctor_id", r.getDoctorId());
            m.put("service_catalog_id", r.getServiceCatalogId());
            m.put("hospital_id", r.getHospitalId());
            m.put("status", r.getStatus());
            m.put("invoice_id", r.getInvoiceId());
            m.put("recommended_price", r.getRecommendedPrice());
            m.put("notes", r.getNotes());
            m.put("created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            catalogRepo.findById(r.getServiceCatalogId()).ifPresent(s -> {
                m.put("service_name", s.getName());
                m.put("service_type", s.getServiceType());
                m.put("service_price", s.getPrice());
            });
            String doctorName = profileRepo.findByUserId(r.getDoctorId()).map(p -> "Dr. " + p.getName()).orElse("Doctor");
            m.put("doctor_name", doctorName);
            out.add(m);
        }
        return out;
    }
}
