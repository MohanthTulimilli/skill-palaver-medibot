package com.medibots.controller;

import com.medibots.entity.Hospital;
import com.medibots.repository.HospitalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalsController {
    private final HospitalRepository hospitalRepo;

    public HospitalsController(HospitalRepository hospitalRepo) {
        this.hospitalRepo = hospitalRepo;
    }

    @GetMapping
    public ResponseEntity<List<Hospital>> list(@RequestParam(required = false) String status) {
        if ("ACTIVE".equals(status))
            return ResponseEntity.ok(hospitalRepo.findByStatusOrderByCreatedAtDesc("ACTIVE"));
        return ResponseEntity.ok(hospitalRepo.findAll());
    }

    @PostMapping
    public ResponseEntity<Hospital> create(@RequestBody Map<String, String> body) {
        Hospital h = new Hospital();
        h.setName(body.get("name"));
        h.setDomain(body.get("domain"));
        h.setStatus(body.getOrDefault("status", "ACTIVE"));
        h = hospitalRepo.save(h);
        return ResponseEntity.ok(h);
    }
}
