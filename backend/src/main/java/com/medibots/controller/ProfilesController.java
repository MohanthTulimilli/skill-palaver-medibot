package com.medibots.controller;

import com.medibots.entity.Profile;
import com.medibots.entity.UserRole;
import com.medibots.repository.ProfileRepository;
import com.medibots.repository.UserRoleRepository;
import com.medibots.repository.HospitalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profiles")
public class ProfilesController {
    private final ProfileRepository profileRepo;
    private final UserRoleRepository userRoleRepo;
    private final HospitalRepository hospitalRepo;

    public ProfilesController(ProfileRepository profileRepo, UserRoleRepository userRoleRepo, HospitalRepository hospitalRepo) {
        this.profileRepo = profileRepo;
        this.userRoleRepo = userRoleRepo;
        this.hospitalRepo = hospitalRepo;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        List<Profile> all = profileRepo.findAll();
        List<String> userIds = all.stream().map(Profile::getUserId).distinct().collect(Collectors.toList());
        Map<String, String> roleByUser = new HashMap<>();
        userRoleRepo.findAll().forEach(ur -> roleByUser.put(ur.getUserId(), ur.getRole()));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Profile p : all) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("user_id", p.getUserId());
            m.put("name", p.getName());
            m.put("email", p.getEmail());
            m.put("created_at", p.getCreatedAt());
            m.put("hospital_id", p.getHospitalId());
            m.put("specialization", p.getSpecialization());
            m.put("specialization_tags", p.getSpecializationTags());
            m.put("role", roleByUser.getOrDefault(p.getUserId(), "PATIENT"));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> doctors(@RequestParam(required = false) String hospitalId) {
        List<Profile> all = profileRepo.findAll();
        Map<String, String> roleByUser = new HashMap<>();
        userRoleRepo.findAll().forEach(ur -> roleByUser.put(ur.getUserId(), ur.getRole()));
        List<Map<String, Object>> out = new ArrayList<>();
        List<Map<String, Object>> allDoctors = new ArrayList<>();
        for (Profile p : all) {
            if (!"DOCTOR".equals(roleByUser.get(p.getUserId()))) continue;
            Map<String, Object> m = new HashMap<>();
            m.put("user_id", p.getUserId());
            m.put("name", p.getName());
            m.put("email", p.getEmail());
            m.put("specialization", p.getSpecialization());
            m.put("hospital_id", p.getHospitalId());
            allDoctors.add(m);
            if (hospitalId != null && !hospitalId.isBlank()) {
                String docHosp = p.getHospitalId();
                if (docHosp != null && !docHosp.isBlank() && !hospitalId.trim().equals(docHosp.trim()))
                    continue;
            }
            out.add(m);
        }
        if (hospitalId != null && !hospitalId.isBlank() && out.isEmpty() && !allDoctors.isEmpty())
            return ResponseEntity.ok(allDoctors);
        return ResponseEntity.ok(out);
    }
}
