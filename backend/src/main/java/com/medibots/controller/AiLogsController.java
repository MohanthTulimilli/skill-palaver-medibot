package com.medibots.controller;

import com.medibots.entity.AiLog;
import com.medibots.repository.AiLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-logs")
public class AiLogsController {
    private final AiLogRepository aiLogRepo;

    public AiLogsController(AiLogRepository aiLogRepo) {
        this.aiLogRepo = aiLogRepo;
    }

    @GetMapping
    public ResponseEntity<List<AiLog>> list() {
        return ResponseEntity.ok(aiLogRepo.findAllByOrderByLogTimeDesc());
    }
}
