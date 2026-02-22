package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "lab_test_bookings")
public class LabTestBooking {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "service_catalog_id", length = 36)
    private String serviceCatalogId;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    private String testName;
    @Column(name = "scheduled_date")
    private Instant scheduledDate;
    @Column(nullable = false, length = 32)
    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, CANCELLED
    @Column(precision = 12, scale = 2)
    private BigDecimal fee;
    private String notes;
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
    public String getServiceCatalogId() { return serviceCatalogId; }
    public void setServiceCatalogId(String serviceCatalogId) { this.serviceCatalogId = serviceCatalogId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public Instant getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(Instant scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
