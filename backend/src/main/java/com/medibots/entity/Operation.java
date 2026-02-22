package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "operations")
public class Operation {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "doctor_id", nullable = false, length = 36)
    private String doctorId;
    @Column(name = "operation_theatre_id", length = 36)
    private String operationTheatreId;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "procedure_name", nullable = false)
    private String procedureName;
    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;
    @Column(nullable = false, length = 32)
    private String status = "SCHEDULED"; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED
    private String notes;
    @Column(precision = 12, scale = 2)
    private BigDecimal estimatedCost;
    private Integer durationMinutes;
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
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getOperationTheatreId() { return operationTheatreId; }
    public void setOperationTheatreId(String operationTheatreId) { this.operationTheatreId = operationTheatreId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getProcedureName() { return procedureName; }
    public void setProcedureName(String procedureName) { this.procedureName = procedureName; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
