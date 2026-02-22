package com.medibots.controller;

import com.medibots.entity.LabReport;
import com.medibots.entity.Patient;
import com.medibots.repository.LabReportRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/lab-reports")
public class LabReportController {
    private final LabReportRepository reportRepo;
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    public LabReportController(LabReportRepository reportRepo, PatientRepository patientRepo, ProfileRepository profileRepo) {
        this.reportRepo = reportRepo;
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        if (patient.isEmpty()) return ResponseEntity.ok(List.of());
        List<LabReport> list = reportRepo.findByPatientIdOrderByUploadedAtDesc(patient.get().getId());
        return ResponseEntity.ok(toMaps(list));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth, @RequestParam(required = false) String hospitalId) {
        if (auth == null) return ResponseEntity.status(401).build();
        String hid = hospitalId;
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
        List<LabReport> list = hid != null ? reportRepo.findByHospitalIdOrderByUploadedAtDesc(hid) : reportRepo.findAll();
        return ResponseEntity.ok(toMaps(list));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patient_id") String patientId,
            @RequestParam(value = "lab_test_booking_id", required = false) String labTestBookingId,
            @RequestParam(value = "hospital_id", required = false) String hospitalId,
            @RequestParam(value = "notes", required = false) String notes,
            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        if (file.getSize() > 10 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "File too large. Max 10MB"));
        String ct = file.getContentType();
        if (ct == null) ct = "";
        boolean allowed = ct.contains("pdf") || ct.contains("image");
        if (!allowed)
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF and images allowed"));
        try {
            Path baseDir = Paths.get(uploadsDir, "lab-reports").toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            String ext = ct.contains("pdf") ? ".pdf" : (ct.contains("png") ? ".png" : ".jpg");
            String filename = "lab_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path target = baseDir.resolve(filename).normalize();
            if (!target.startsWith(baseDir))
                return ResponseEntity.internalServerError().body(Map.of("error", "Invalid path"));
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            LabReport r = new LabReport();
            r.setPatientId(patientId);
            r.setLabTestBookingId(labTestBookingId);
            r.setHospitalId(hospitalId);
            r.setFilePath("lab-reports/" + filename);
            r.setFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : filename);
            r.setStatus("UPLOADED");
            r.setNotes(notes);
            r.setUploadedAt(Instant.now());
            r.setUploadedBy(auth.getName());
            r = reportRepo.save(r);
            Map<String, Object> out = new HashMap<>();
            out.put("id", r.getId());
            out.put("patient_id", r.getPatientId());
            out.put("filename", r.getFilename());
            out.put("status", r.getStatus());
            out.put("uploaded_at", r.getUploadedAt());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName())));
        }
    }

    @GetMapping("/serve/{id}")
    public ResponseEntity<Resource> serve(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return reportRepo.findById(id).map(r -> {
            try {
                Path baseDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
                Path file = baseDir.resolve(r.getFilePath()).normalize();
                if (!file.startsWith(baseDir) || !Files.exists(file)) return ResponseEntity.notFound().<Resource>build();
                Resource res = new UrlResource(file.toUri());
                String ct = Files.probeContentType(file);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(ct != null ? ct : "application/octet-stream"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (r.getFilename() != null ? r.getFilename() : "report") + "\"")
                        .body(res);
            } catch (Exception e) {
                return ResponseEntity.notFound().<Resource>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<LabReport> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return reportRepo.findById(id).map(r -> {
            if (body.get("status") != null) r.setStatus(body.get("status"));
            if (body.get("notes") != null) r.setNotes(body.get("notes"));
            return ResponseEntity.ok(reportRepo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<Map<String, Object>> toMaps(List<LabReport> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (LabReport r : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("patient_id", r.getPatientId());
            m.put("lab_test_booking_id", r.getLabTestBookingId());
            m.put("hospital_id", r.getHospitalId());
            m.put("filename", r.getFilename());
            m.put("status", r.getStatus());
            m.put("notes", r.getNotes());
            m.put("uploaded_at", r.getUploadedAt() != null ? r.getUploadedAt().toString() : null);
            String patientName = patientRepo.findById(r.getPatientId())
                    .map(Patient::getFullName)
                    .orElse(profileRepo.findByUserId(r.getPatientId()).map(p -> p.getName()).orElse("Patient"));
            m.put("patient_name", patientName);
            out.add(m);
        }
        return out;
    }
}
