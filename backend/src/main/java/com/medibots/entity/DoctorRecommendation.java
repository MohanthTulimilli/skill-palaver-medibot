package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "doctor_recommendations")
public class DoctorRecommendation {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "appointment_id", nullable = false, length = 36)
    private String appointmentId;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "doctor_id", nullable = false, length = 36)
    private String doctorId;
    @Column(name = "service_catalog_id", nullable = false, length = 36)
    private String serviceCatalogId;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, INVOICED, PAID, COMPLETED, CANCELLED
    @Column(name = "invoice_id", length = 36)
    private String invoiceId;
    @Column(precision = 12, scale = 2)
    private BigDecimal recommendedPrice;
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
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getServiceCatalogId() { return serviceCatalogId; }
    public void setServiceCatalogId(String serviceCatalogId) { this.serviceCatalogId = serviceCatalogId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
    public BigDecimal getRecommendedPrice() { return recommendedPrice; }
    public void setRecommendedPrice(BigDecimal recommendedPrice) { this.recommendedPrice = recommendedPrice; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
