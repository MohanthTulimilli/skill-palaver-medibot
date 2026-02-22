package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * ML-ready table storing engineered features for claims.
 * Populated by feature engineering pipelines, not directly by user input.
 */
@Entity
@Table(name = "claim_features")
public class ClaimFeatures {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "claim_id", nullable = false, unique = true, length = 36)
    private String claimId;
    @Column(name = "risk_score_normalized", precision = 5, scale = 4)
    private BigDecimal riskScoreNormalized;
    @Column(name = "amount_to_coverage_ratio", precision = 10, scale = 6)
    private BigDecimal amountToCoverageRatio;
    @Column(name = "denial_history_score", precision = 5, scale = 4)
    private BigDecimal denialHistoryScore;
    @Column(name = "documentation_score", precision = 5, scale = 4)
    private BigDecimal documentationScore;
    @Column(name = "urgency_score", precision = 5, scale = 4)
    private BigDecimal urgencyScore;
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
    public String getClaimId() { return claimId; }
    public void setClaimId(String claimId) { this.claimId = claimId; }
    public BigDecimal getRiskScoreNormalized() { return riskScoreNormalized; }
    public void setRiskScoreNormalized(BigDecimal riskScoreNormalized) { this.riskScoreNormalized = riskScoreNormalized; }
    public BigDecimal getAmountToCoverageRatio() { return amountToCoverageRatio; }
    public void setAmountToCoverageRatio(BigDecimal amountToCoverageRatio) { this.amountToCoverageRatio = amountToCoverageRatio; }
    public BigDecimal getDenialHistoryScore() { return denialHistoryScore; }
    public void setDenialHistoryScore(BigDecimal denialHistoryScore) { this.denialHistoryScore = denialHistoryScore; }
    public BigDecimal getDocumentationScore() { return documentationScore; }
    public void setDocumentationScore(BigDecimal documentationScore) { this.documentationScore = documentationScore; }
    public BigDecimal getUrgencyScore() { return urgencyScore; }
    public void setUrgencyScore(BigDecimal urgencyScore) { this.urgencyScore = urgencyScore; }
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
