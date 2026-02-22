package com.medibots.controller;

import com.medibots.service.OnboardingValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patients/onboarding")
public class OnboardingValidationController {

    private final OnboardingValidationService validationService;

    public OnboardingValidationController(OnboardingValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        @SuppressWarnings("unchecked")
        Map<String, Object> formData = (Map<String, Object>) body.getOrDefault("formData", Map.of());
        boolean hasPhotoId = Boolean.TRUE.equals(body.get("hasPhotoId"));
        boolean hasInsuranceCard = Boolean.TRUE.equals(body.get("hasInsuranceCard"));
        Map<String, Object> result = validationService.validate(formData, hasPhotoId, hasInsuranceCard);
        return ResponseEntity.ok(result);
    }
}
