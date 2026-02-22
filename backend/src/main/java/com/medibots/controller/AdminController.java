package com.medibots.controller;

import com.medibots.dto.SignupRequest;
import com.medibots.dto.AuthResponse;
import com.medibots.entity.Profile;
import com.medibots.entity.UserRole;
import com.medibots.repository.ProfileRepository;
import com.medibots.repository.UserRoleRepository;
import com.medibots.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuthService authService;
    private final ProfileRepository profileRepo;
    private final UserRoleRepository userRoleRepo;

    public AdminController(AuthService authService, ProfileRepository profileRepo, UserRoleRepository userRoleRepo) {
        this.authService = authService;
        this.profileRepo = profileRepo;
        this.userRoleRepo = userRoleRepo;
    }

    @PostMapping("/create-user")
    public ResponseEntity<AuthResponse> createUser(@RequestBody Map<String, Object> body) {
        SignupRequest req = new SignupRequest();
        req.setEmail((String) body.get("email"));
        req.setPassword((String) body.get("password"));
        req.setName((String) body.get("name"));
        if (body.get("hospital_id") != null) req.setHospitalId((String) body.get("hospital_id"));
        if (body.get("role") != null) req.setRole((String) body.get("role"));
        if (body.get("specialization") != null) req.setSpecialization((String) body.get("specialization"));
        if (body.get("specialization_tags") != null) req.setSpecializationTags((String) body.get("specialization_tags"));
        AuthResponse res = authService.signup(req);
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<Void> updateUser(@PathVariable String userId, @RequestBody Map<String, Object> body) {
        profileRepo.findByUserId(userId).ifPresent(p -> {
            if (body.get("name") != null) p.setName((String) body.get("name"));
            if (body.get("specialization") != null) p.setSpecialization((String) body.get("specialization"));
            if (body.get("specialization_tags") != null) p.setSpecializationTags((String) body.get("specialization_tags"));
            if (body.get("hospital_id") != null) p.setHospitalId((String) body.get("hospital_id"));
            profileRepo.save(p);
        });
        if (body.get("role") != null) {
            userRoleRepo.findByUserId(userId).ifPresent(ur -> {
                ur.setRole((String) body.get("role"));
                userRoleRepo.save(ur);
            });
        }
        return ResponseEntity.ok().build();
    }
}
