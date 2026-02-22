package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * ML-ready table storing engineered features for invoices.
 * Populated by feature engineering pipelines, not directly by user input.
 */
@Entity
@Table(name = "invoice_features")
public class InvoiceFeatures {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "invoice_id", nullable = false, unique = true, length = 36)
    private String invoiceId;
    @Column(name = "payment_delay_score", precision = 5, scale = 4)
    private BigDecimal paymentDelayScore;
    @Column(name = "amount_tier", length = 20)
    private String amountTier;
    @Column(name = "payer_reliability_score", precision = 5, scale = 4)
    private BigDecimal payerReliabilityScore;
    @Column(name = "reminder_effectiveness_score", precision = 5, scale = 4)
    private BigDecimal reminderEffectivenessScore;
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
    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
    public BigDecimal getPaymentDelayScore() { return paymentDelayScore; }
    public void setPaymentDelayScore(BigDecimal paymentDelayScore) { this.paymentDelayScore = paymentDelayScore; }
    public String getAmountTier() { return amountTier; }
    public void setAmountTier(String amountTier) { this.amountTier = amountTier; }
    public BigDecimal getPayerReliabilityScore() { return payerReliabilityScore; }
    public void setPayerReliabilityScore(BigDecimal payerReliabilityScore) { this.payerReliabilityScore = payerReliabilityScore; }
    public BigDecimal getReminderEffectivenessScore() { return reminderEffectivenessScore; }
    public void setReminderEffectivenessScore(BigDecimal reminderEffectivenessScore) { this.reminderEffectivenessScore = reminderEffectivenessScore; }
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
