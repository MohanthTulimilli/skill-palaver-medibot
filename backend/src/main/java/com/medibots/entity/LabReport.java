package com.medibots.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "lab_reports")
public class LabReport {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "lab_test_booking_id", length = 36)
    private String labTestBookingId;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "file_path", nullable = false)
    private String filePath;
    private String filename;
    @Column(nullable = false, length = 32)
    private String status = "UPLOADED"; // PENDING, UPLOADED, VERIFIED
    private String notes;
    @Column(name = "uploaded_at")
    private Instant uploadedAt;
    @Column(name = "uploaded_by", length = 36)
    private String uploadedBy;
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
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getLabTestBookingId() { return labTestBookingId; }
    public void setLabTestBookingId(String labTestBookingId) { this.labTestBookingId = labTestBookingId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
