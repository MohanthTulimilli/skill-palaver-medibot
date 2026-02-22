package com.medibots.controller;

import com.medibots.entity.OperationTheatre;
import com.medibots.repository.OperationTheatreRepository;
import com.medibots.repository.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operation-theatres")
public class OperationTheatreController {
    private final OperationTheatreRepository theatreRepo;
    private final ProfileRepository profileRepo;

    public OperationTheatreController(OperationTheatreRepository theatreRepo, ProfileRepository profileRepo) {
        this.theatreRepo = theatreRepo;
        this.profileRepo = profileRepo;
    }

    private String hospitalIdFromAuth(Authentication auth, String queryHospitalId) {
        if (queryHospitalId != null && !queryHospitalId.isBlank()) return queryHospitalId;
        if (auth == null) return null;
        return profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<OperationTheatre>> list(Authentication auth, @RequestParam(required = false) String hospitalId) {
        String hid = hospitalIdFromAuth(auth, hospitalId);
        if (hid != null)
            return ResponseEntity.ok(theatreRepo.findByHospitalIdAndStatusOrderByName(hid, "ACTIVE"));
        return ResponseEntity.ok(theatreRepo.findAll());
    }

    @PostMapping
    public ResponseEntity<OperationTheatre> create(Authentication auth, @RequestBody Map<String, Object> body) {
        String hid = (String) body.get("hospital_id");
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth != null ? auth.getName() : null).map(p -> p.getHospitalId()).orElse(null);
        OperationTheatre t = new OperationTheatre();
        t.setHospitalId(hid);
        t.setDepartmentId((String) body.get("department_id"));
        t.setName((String) body.get("name"));
        t.setDescription((String) body.get("description"));
        t.setCapacity(body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : 1);
        t.setStatus((String) body.getOrDefault("status", "ACTIVE"));
        return ResponseEntity.ok(theatreRepo.save(t));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OperationTheatre> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return theatreRepo.findById(id).map(t -> {
            if (body.get("name") != null) t.setName((String) body.get("name"));
            if (body.get("department_id") != null) t.setDepartmentId((String) body.get("department_id"));
            if (body.get("description") != null) t.setDescription((String) body.get("description"));
            if (body.get("capacity") != null) t.setCapacity(((Number) body.get("capacity")).intValue());
            if (body.get("status") != null) t.setStatus((String) body.get("status"));
            return ResponseEntity.ok(theatreRepo.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (theatreRepo.existsById(id)) {
            theatreRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
