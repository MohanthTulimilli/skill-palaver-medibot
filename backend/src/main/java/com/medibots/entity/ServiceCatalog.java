package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "service_catalog")
public class ServiceCatalog {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "hospital_id", nullable = false, length = 36)
    private String hospitalId;
    @Column(name = "department_id", length = 36)
    private String departmentId;
    private String name;
    @Column(name = "service_type", length = 64)
    private String serviceType; // CHECKUP, IMAGING, LAB_TEST, SURGERY, PROCEDURE, EMERGENCY
    @Column(name = "category", length = 64)
    private String category; // e.g. X-RAY, CT_SCAN, BLOOD_TEST
    @Column(name = "subcategory", length = 128)
    private String subcategory; // e.g. Chest X-ray, Brain CT
    @Column(precision = 12, scale = 2)
    private BigDecimal price;
    private String description;
    private String status = "ACTIVE";
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
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
