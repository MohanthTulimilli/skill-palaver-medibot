package com.medibots.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.math.BigDecimal;

@Entity
@Table(name = "ai_logs")
public class AiLog {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "claim_id", nullable = false, length = 36)
    private String claimId;
    @Column(name = "prediction_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal predictionScore = BigDecimal.ZERO;
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal confidence = BigDecimal.ZERO;
    private boolean flagged;
    @Column(name = "log_time", nullable = false)
    private Instant logTime;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (logTime == null) logTime = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getClaimId() { return claimId; }
    public void setClaimId(String claimId) { this.claimId = claimId; }
    public BigDecimal getPredictionScore() { return predictionScore; }
    public void setPredictionScore(BigDecimal predictionScore) { this.predictionScore = predictionScore; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean flagged) { this.flagged = flagged; }
    public Instant getLogTime() { return logTime; }
    public void setLogTime(Instant logTime) { this.logTime = logTime; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
}
