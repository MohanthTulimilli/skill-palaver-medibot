package com.medibots.controller;

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
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients/documents")
public class PatientDocumentsController {

    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/pjpeg", "image/x-png"
    );

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized. Please log in."));
        }
        if (!"photo_id".equals(type) && !"insurance_card".equals(type)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid type. Use photo_id or insurance_card."));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided."));
        }
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File too large. Max 10MB."));
        }
        String contentType = file.getContentType();
        if (contentType != null) contentType = contentType.toLowerCase().split(";")[0].trim();
        boolean allowed = contentType != null && ALLOWED_TYPES.contains(contentType);
        if (!allowed && contentType != null && contentType.startsWith("image/")) {
            allowed = contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/jpg");
        }
        if (!allowed) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PNG and JPG images are allowed. Got: " + contentType));
        }
        try {
            Path baseDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            String ext = (contentType != null && contentType.contains("png")) ? ".png" : ".jpg";
            String safeUserId = auth.getName().replaceAll("[^a-zA-Z0-9_-]", "_");
            String filename = safeUserId + "_" + type + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path target = baseDir.resolve(filename).normalize();
            if (!target.startsWith(baseDir)) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Invalid path."));
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(Map.of("path", filename, "filename", filename));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName())));
        }
    }

    /** Serve an uploaded document. Filename must not contain path separators. */
    @GetMapping("/serve/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Path dir = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Path file = dir.resolve(filename).normalize();
            if (!file.startsWith(dir) || !Files.exists(file)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
