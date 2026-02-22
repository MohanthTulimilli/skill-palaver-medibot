package com.medibots.controller;

import com.medibots.entity.Department;
import com.medibots.repository.DepartmentRepository;
import com.medibots.repository.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentsController {
    private final DepartmentRepository deptRepo;
    private final ProfileRepository profileRepo;

    public DepartmentsController(DepartmentRepository deptRepo, ProfileRepository profileRepo) {
        this.deptRepo = deptRepo;
        this.profileRepo = profileRepo;
    }

    private String hospitalIdFromAuth(Authentication auth, String queryHospitalId) {
        if (queryHospitalId != null && !queryHospitalId.isBlank()) return queryHospitalId;
        if (auth == null) return null;
        return profileRepo.findByUserId(auth.getName())
                .map(p -> p.getHospitalId())
                .orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<Department>> list(Authentication auth, @RequestParam(required = false) String hospitalId) {
        String hid = hospitalIdFromAuth(auth, hospitalId);
        if (hid != null)
            return ResponseEntity.ok(deptRepo.findByHospitalIdAndStatusOrderByName(hid, "ACTIVE"));
        return ResponseEntity.ok(deptRepo.findAll());
    }

    @PostMapping
    public ResponseEntity<Department> create(Authentication auth, @RequestBody Map<String, Object> body) {
        String hid = (String) body.get("hospital_id");
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth != null ? auth.getName() : null).map(p -> p.getHospitalId()).orElse(null);
        Department d = new Department();
        d.setHospitalId(hid);
        d.setName((String) body.get("name"));
        d.setDescription((String) body.get("description"));
        d.setStatus((String) body.getOrDefault("status", "ACTIVE"));
        return ResponseEntity.ok(deptRepo.save(d));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return deptRepo.findById(id).map(d -> {
            if (body.get("name") != null) d.setName((String) body.get("name"));
            if (body.get("description") != null) d.setDescription((String) body.get("description"));
            if (body.get("status") != null) d.setStatus((String) body.get("status"));
            return ResponseEntity.ok(deptRepo.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (deptRepo.existsById(id)) {
            deptRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
