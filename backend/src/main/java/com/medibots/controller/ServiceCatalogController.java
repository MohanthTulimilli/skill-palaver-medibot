package com.medibots.controller;

import com.medibots.entity.ServiceCatalog;
import com.medibots.repository.ProfileRepository;
import com.medibots.repository.ServiceCatalogRepository;
import com.medibots.service.ServiceCatalogSeedService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/service-catalog")
public class ServiceCatalogController {
    private final ServiceCatalogRepository catalogRepo;
    private final ProfileRepository profileRepo;
    private final ServiceCatalogSeedService seedService;

    public ServiceCatalogController(ServiceCatalogRepository catalogRepo, ProfileRepository profileRepo, ServiceCatalogSeedService seedService) {
        this.catalogRepo = catalogRepo;
        this.profileRepo = profileRepo;
        this.seedService = seedService;
    }

    private String hospitalIdFromAuth(Authentication auth, String queryHospitalId) {
        if (queryHospitalId != null && !queryHospitalId.isBlank()) return queryHospitalId;
        if (auth == null) return null;
        return profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<ServiceCatalog>> list(Authentication auth,
                                                     @RequestParam(required = false) String hospitalId,
                                                     @RequestParam(required = false) String serviceType) {
        String hid = hospitalIdFromAuth(auth, hospitalId);
        if (hid != null && serviceType != null && !serviceType.isBlank())
            return ResponseEntity.ok(catalogRepo.findByHospitalIdAndServiceTypeOrderByName(hid, serviceType));
        if (hid != null)
            return ResponseEntity.ok(catalogRepo.findByHospitalIdAndStatusOrderByName(hid, "ACTIVE"));
        return ResponseEntity.ok(catalogRepo.findAll());
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed(Authentication auth, @RequestParam String hospitalId) {
        int count = seedService.seedForHospital(hospitalId);
        return ResponseEntity.ok(java.util.Map.of("message", "Catalog seeded", "count", count));
    }

    @PostMapping
    public ResponseEntity<?> create(Authentication auth, @RequestBody Map<String, Object> body) {
        String hid = (String) body.get("hospital_id");
        if (hid == null || hid.isBlank())
            hid = profileRepo.findByUserId(auth != null ? auth.getName() : null).map(p -> p.getHospitalId()).orElse(null);
        if (hid == null || hid.isBlank())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "hospital_id is required. Ensure your profile has a hospital assigned."));
        ServiceCatalog s = new ServiceCatalog();
        s.setHospitalId(hid);
        s.setDepartmentId((String) body.get("department_id"));
        s.setName((String) body.get("name"));
        s.setServiceType((String) body.getOrDefault("service_type", "GENERAL"));
        s.setCategory((String) body.get("category"));
        s.setSubcategory((String) body.get("subcategory"));
        Object price = body.get("price");
        if (price != null) s.setPrice(new BigDecimal(price.toString()));
        s.setDescription((String) body.get("description"));
        s.setStatus((String) body.getOrDefault("status", "ACTIVE"));
        return ResponseEntity.ok(catalogRepo.save(s));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ServiceCatalog> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return catalogRepo.findById(id).map(s -> {
            if (body.get("name") != null) s.setName((String) body.get("name"));
            if (body.get("department_id") != null) s.setDepartmentId((String) body.get("department_id"));
            if (body.get("service_type") != null) s.setServiceType((String) body.get("service_type"));
            if (body.get("category") != null) s.setCategory((String) body.get("category"));
            if (body.get("subcategory") != null) s.setSubcategory((String) body.get("subcategory"));
            if (body.get("price") != null) s.setPrice(new BigDecimal(body.get("price").toString()));
            if (body.get("description") != null) s.setDescription((String) body.get("description"));
            if (body.get("status") != null) s.setStatus((String) body.get("status"));
            return ResponseEntity.ok(catalogRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (catalogRepo.existsById(id)) {
            catalogRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
