package com.medibots.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @Column(length = 36)
    private String id;
    @Column(nullable = false)
    private String action;
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
    @Column(columnDefinition = "TEXT")
    private String details;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
