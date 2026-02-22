package com.medibots.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "profiles")
public class Profile {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "user_id", unique = true, nullable = false, length = 36)
    private String userId;
    private String name;
    private String email;
    private String avatarUrl;
    private String specialization;
    @Column(name = "specialization_tags", length = 512)
    private String specializationTags; // Comma-separated tags: Cardiology, General Medicine
    private String status = "ACTIVE";
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getSpecializationTags() { return specializationTags; }
    public void setSpecializationTags(String specializationTags) { this.specializationTags = specializationTags; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
