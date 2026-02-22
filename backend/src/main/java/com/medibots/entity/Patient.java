package com.medibots.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "user_id", unique = true, nullable = false, length = 36)
    private String userId;
    @Column(name = "full_name")
    private String fullName;
    private LocalDate dob;
    private String gender;
    private String insuranceProvider;
    private String policyNumber;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "photo_id_path", length = 512)
    private String photoIdPath;
    @Column(name = "insurance_card_path", length = 512)
    private String insuranceCardPath;
    @Column(name = "onboarding_status", length = 32)
    private String onboardingStatus = "PENDING_APPROVAL";
    @Column(name = "validation_report_json", columnDefinition = "TEXT")
    private String validationReportJson;
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
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }
    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getPhotoIdPath() { return photoIdPath; }
    public void setPhotoIdPath(String photoIdPath) { this.photoIdPath = photoIdPath; }
    public String getInsuranceCardPath() { return insuranceCardPath; }
    public void setInsuranceCardPath(String insuranceCardPath) { this.insuranceCardPath = insuranceCardPath; }
    public String getOnboardingStatus() { return onboardingStatus; }
    public void setOnboardingStatus(String onboardingStatus) { this.onboardingStatus = onboardingStatus; }
    public String getValidationReportJson() { return validationReportJson; }
    public void setValidationReportJson(String validationReportJson) { this.validationReportJson = validationReportJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
