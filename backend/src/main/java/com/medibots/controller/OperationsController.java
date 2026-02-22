package com.medibots.controller;

import com.medibots.entity.Operation;
import com.medibots.entity.Patient;
import com.medibots.repository.OperationRepository;
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
@RequestMapping("/api/operations")
public class OperationsController {
    private final OperationRepository opRepo;
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;

    public OperationsController(OperationRepository opRepo, PatientRepository patientRepo, ProfileRepository profileRepo) {
        this.opRepo = opRepo;
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        if (patient.isEmpty()) return ResponseEntity.ok(List.of());
        List<Operation> list = opRepo.findByPatientIdOrderByScheduledAtDesc(patient.get().getId());
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping("/doctor")
    public ResponseEntity<List<Map<String, Object>>> doctorList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        List<Operation> list = opRepo.findByDoctorIdOrderByScheduledAtDesc(auth.getName());
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth, @RequestParam(required = false) String hospitalId) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hid = hospitalId;
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
        List<Operation> list = hid != null ? opRepo.findByHospitalIdOrderByScheduledAtDesc(hid) : opRepo.findAll();
        return ResponseEntity.ok(toMaps(list));
    }

    @PostMapping
    public ResponseEntity<Operation> create(Authentication auth, @RequestBody Map<String, Object> body) {
        Operation o = new Operation();
        o.setPatientId((String) body.get("patient_id"));
        o.setDoctorId((String) body.get("doctor_id"));
        o.setOperationTheatreId((String) body.get("operation_theatre_id"));
        o.setHospitalId((String) body.get("hospital_id"));
        o.setProcedureName((String) body.get("procedure_name"));
        Object sa = body.get("scheduled_at");
        if (sa != null) try { o.setScheduledAt(Instant.parse(sa.toString())); } catch (DateTimeParseException ignored) {}
        o.setStatus((String) body.getOrDefault("status", "SCHEDULED"));
        o.setNotes((String) body.get("notes"));
        Object ec = body.get("estimated_cost");
        if (ec != null) o.setEstimatedCost(new BigDecimal(ec.toString()));
        Object dm = body.get("duration_minutes");
        if (dm != null) o.setDurationMinutes(((Number) dm).intValue());
        return ResponseEntity.ok(opRepo.save(o));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Operation> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return opRepo.findById(id).map(o -> {
            if (body.get("scheduled_at") != null) try { o.setScheduledAt(Instant.parse(body.get("scheduled_at").toString())); } catch (Exception ignored) {}
            if (body.get("status") != null) o.setStatus((String) body.get("status"));
            if (body.get("operation_theatre_id") != null) o.setOperationTheatreId((String) body.get("operation_theatre_id"));
            if (body.get("notes") != null) o.setNotes((String) body.get("notes"));
            return ResponseEntity.ok(opRepo.save(o));
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<Map<String, Object>> toMaps(List<Operation> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Operation o : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", o.getId());
            m.put("patient_id", o.getPatientId());
            m.put("doctor_id", o.getDoctorId());
            m.put("operation_theatre_id", o.getOperationTheatreId());
            m.put("hospital_id", o.getHospitalId());
            m.put("procedure_name", o.getProcedureName());
            m.put("scheduled_at", o.getScheduledAt() != null ? o.getScheduledAt().toString() : null);
            m.put("status", o.getStatus());
            m.put("notes", o.getNotes());
            m.put("estimated_cost", o.getEstimatedCost());
            m.put("duration_minutes", o.getDurationMinutes());
            String patientName = patientRepo.findById(o.getPatientId())
                    .map(Patient::getFullName)
                    .orElse(profileRepo.findByUserId(o.getPatientId()).map(p -> p.getName()).orElse("Patient"));
            String doctorName = profileRepo.findByUserId(o.getDoctorId()).map(p -> "Dr. " + p.getName()).orElse("Doctor");
            m.put("patient_name", patientName);
            m.put("doctor_name", doctorName);
            out.add(m);
        }
        return out;
    }
}
