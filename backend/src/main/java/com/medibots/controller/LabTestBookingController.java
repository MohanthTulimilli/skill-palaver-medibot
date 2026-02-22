package com.medibots.controller;

import com.medibots.entity.LabTestBooking;
import com.medibots.entity.Patient;
import com.medibots.repository.LabTestBookingRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.repository.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-test-bookings")
public class LabTestBookingController {
    private final LabTestBookingRepository bookingRepo;
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;

    public LabTestBookingController(LabTestBookingRepository bookingRepo, PatientRepository patientRepo, ProfileRepository profileRepo) {
        this.bookingRepo = bookingRepo;
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        if (patient.isEmpty()) return ResponseEntity.ok(List.of());
        List<LabTestBooking> list = bookingRepo.findByPatientIdOrderByScheduledDateDesc(patient.get().getId());
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth, @RequestParam(required = false) String hospitalId) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hid = hospitalId;
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
        if (hid != null) {
            List<LabTestBooking> list = bookingRepo.findByHospitalIdOrderByScheduledDateDesc(hid);
            return ResponseEntity.ok(toMaps(list));
        }
        return ResponseEntity.ok(toMaps(bookingRepo.findAll()));
    }

    @PostMapping
    public ResponseEntity<LabTestBooking> create(Authentication auth, @RequestBody Map<String, Object> body) {
        LabTestBooking b = new LabTestBooking();
        b.setPatientId((String) body.get("patient_id"));
        b.setServiceCatalogId((String) body.get("service_catalog_id"));
        b.setHospitalId((String) body.get("hospital_id"));
        b.setTestName((String) body.get("test_name"));
        Object sd = body.get("scheduled_date");
        if (sd != null) {
            try { b.setScheduledDate(Instant.parse(sd.toString())); } catch (DateTimeParseException ignored) {}
        }
        b.setStatus((String) body.getOrDefault("status", "SCHEDULED"));
        Object fee = body.get("fee");
        if (fee != null) b.setFee(new BigDecimal(fee.toString()));
        b.setNotes((String) body.get("notes"));
        return ResponseEntity.ok(bookingRepo.save(b));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<LabTestBooking> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return bookingRepo.findById(id).map(b -> {
            if (body.get("scheduled_date") != null) try { b.setScheduledDate(Instant.parse(body.get("scheduled_date").toString())); } catch (Exception ignored) {}
            if (body.get("status") != null) b.setStatus((String) body.get("status"));
            if (body.get("notes") != null) b.setNotes((String) body.get("notes"));
            return ResponseEntity.ok(bookingRepo.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<Map<String, Object>> toMaps(List<LabTestBooking> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (LabTestBooking b : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("patient_id", b.getPatientId());
            m.put("service_catalog_id", b.getServiceCatalogId());
            m.put("hospital_id", b.getHospitalId());
            m.put("test_name", b.getTestName());
            m.put("scheduled_date", b.getScheduledDate() != null ? b.getScheduledDate().toString() : null);
            m.put("status", b.getStatus());
            m.put("fee", b.getFee());
            m.put("notes", b.getNotes());
            String patientName = patientRepo.findById(b.getPatientId())
                    .map(Patient::getFullName)
                    .orElse(profileRepo.findByUserId(b.getPatientId()).map(p -> p.getName()).orElse("Patient"));
            m.put("patient_name", patientName);
            out.add(m);
        }
        return out;
    }
}
