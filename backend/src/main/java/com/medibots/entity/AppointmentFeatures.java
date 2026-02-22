package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * ML-ready table storing engineered features for appointments.
 * Populated by feature engineering pipelines, not directly by user input.
 */
@Entity
@Table(name = "appointment_features")
public class AppointmentFeatures {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "appointment_id", nullable = false, unique = true, length = 36)
    private String appointmentId;
    @Column(name = "no_show_risk_score", precision = 5, scale = 4)
    private BigDecimal noShowRiskScore;
    @Column(name = "lead_time_score", precision = 5, scale = 4)
    private BigDecimal leadTimeScore;
    @Column(name = "engagement_score", precision = 5, scale = 4)
    private BigDecimal engagementScore;
    @Column(name = "slot_popularity_score", precision = 5, scale = 4)
    private BigDecimal slotPopularityScore;
    @Column(name = "feature_vector_json", columnDefinition = "TEXT")
    private String featureVectorJson;
    @Column(name = "ml_prediction")
    private Integer mlPrediction;
    @Column(name = "ml_probability", precision = 5, scale = 4)
    private java.math.BigDecimal mlProbability;
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
    public BigDecimal getNoShowRiskScore() { return noShowRiskScore; }
    public void setNoShowRiskScore(BigDecimal noShowRiskScore) { this.noShowRiskScore = noShowRiskScore; }
    public BigDecimal getLeadTimeScore() { return leadTimeScore; }
    public void setLeadTimeScore(BigDecimal leadTimeScore) { this.leadTimeScore = leadTimeScore; }
    public BigDecimal getEngagementScore() { return engagementScore; }
    public void setEngagementScore(BigDecimal engagementScore) { this.engagementScore = engagementScore; }
    public BigDecimal getSlotPopularityScore() { return slotPopularityScore; }
    public void setSlotPopularityScore(BigDecimal slotPopularityScore) { this.slotPopularityScore = slotPopularityScore; }
    public String getFeatureVectorJson() { return featureVectorJson; }
    public void setFeatureVectorJson(String featureVectorJson) { this.featureVectorJson = featureVectorJson; }
    public Integer getMlPrediction() { return mlPrediction; }
    public void setMlPrediction(Integer mlPrediction) { this.mlPrediction = mlPrediction; }
    public java.math.BigDecimal getMlProbability() { return mlProbability; }
    public void setMlProbability(java.math.BigDecimal mlProbability) { this.mlProbability = mlProbability; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
