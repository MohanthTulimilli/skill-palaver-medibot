package com.medibots.controller;

import com.medibots.entity.AuditLog;
import com.medibots.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogsController {
    private final AuditLogRepository auditRepo;

    public AuditLogsController(AuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> list() {
        return ResponseEntity.ok(auditRepo.findAllByOrderByCreatedAtDesc());
    }
}
