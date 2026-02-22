package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "claims")
public class Claim {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "claim_number", unique = true, nullable = false)
    private String claimNumber;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "insurance_provider", nullable = false)
    private String insuranceProvider;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;
    @Column(nullable = false, length = 32)
    private String status = "PENDING";
    @Column(name = "ai_risk_score", precision = 5, scale = 2)
    private BigDecimal aiRiskScore;
    @Column(name = "ai_explanation", columnDefinition = "TEXT")
    private String aiExplanation;
    @Column(name = "submitted_by", nullable = false, length = 36)
    private String submittedBy;
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;
    @Column(name = "processed_at")
    private Instant processedAt;
    @Column(name = "appointment_id", length = 36)
    private String appointmentId;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "primary_icd_code", length = 20)
    private String primaryIcdCode;
    @Column(name = "secondary_icd_code", length = 20)
    private String secondaryIcdCode;
    @Column(name = "cpt_code", length = 20)
    private String cptCode;
    @Column(name = "procedure_category", length = 50)
    private String procedureCategory;
    @Column(name = "medical_necessity_score")
    private Integer medicalNecessityScore;
    @Column(name = "prior_denial_count")
    private Integer priorDenialCount;
    @Column(name = "resubmission_count")
    private Integer resubmissionCount;
    @Column(name = "days_to_submission")
    private Integer daysToSubmission;
    @Column(name = "documentation_complete")
    private Boolean documentationComplete;
    @Column(name = "claim_type", length = 50)
    private String claimType;
    @Column(name = "policy_type", length = 50)
    private String policyType;
    @Column(name = "coverage_limit", precision = 12, scale = 2)
    private BigDecimal coverageLimit;
    @Column(name = "deductible_amount", precision = 12, scale = 2)
    private BigDecimal deductibleAmount;
    @Column(name = "preauthorization_required")
    private Boolean preauthorizationRequired;
    @Column(name = "preauthorization_obtained")
    private Boolean preauthorizationObtained;
    @Column(name = "patient_age")
    private Integer patientAge;
    @Column(name = "patient_gender", length = 20)
    private String patientGender;
    @Column(name = "chronic_condition_flag")
    private Boolean chronicConditionFlag;
    @Column(name = "doctor_specialization", length = 100)
    private String doctorSpecialization;
    @Column(name = "hospital_tier", length = 20)
    private String hospitalTier;
    @Column(name = "hospital_claim_success_rate", precision = 5, scale = 2)
    private BigDecimal hospitalClaimSuccessRate;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (claimNumber == null) claimNumber = "CLM-" + id.substring(0, 8);
        if (submittedAt == null) submittedAt = Instant.now();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getClaimNumber() { return claimNumber; }
    public void setClaimNumber(String claimNumber) { this.claimNumber = claimNumber; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAiRiskScore() { return aiRiskScore; }
    public void setAiRiskScore(BigDecimal aiRiskScore) { this.aiRiskScore = aiRiskScore; }
    public String getAiExplanation() { return aiExplanation; }
    public void setAiExplanation(String aiExplanation) { this.aiExplanation = aiExplanation; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getPrimaryIcdCode() { return primaryIcdCode; }
    public void setPrimaryIcdCode(String primaryIcdCode) { this.primaryIcdCode = primaryIcdCode; }
    public String getSecondaryIcdCode() { return secondaryIcdCode; }
    public void setSecondaryIcdCode(String secondaryIcdCode) { this.secondaryIcdCode = secondaryIcdCode; }
    public String getCptCode() { return cptCode; }
    public void setCptCode(String cptCode) { this.cptCode = cptCode; }
    public String getProcedureCategory() { return procedureCategory; }
    public void setProcedureCategory(String procedureCategory) { this.procedureCategory = procedureCategory; }
    public Integer getMedicalNecessityScore() { return medicalNecessityScore; }
    public void setMedicalNecessityScore(Integer medicalNecessityScore) { this.medicalNecessityScore = medicalNecessityScore; }
    public Integer getPriorDenialCount() { return priorDenialCount; }
    public void setPriorDenialCount(Integer priorDenialCount) { this.priorDenialCount = priorDenialCount; }
    public Integer getResubmissionCount() { return resubmissionCount; }
    public void setResubmissionCount(Integer resubmissionCount) { this.resubmissionCount = resubmissionCount; }
    public Integer getDaysToSubmission() { return daysToSubmission; }
    public void setDaysToSubmission(Integer daysToSubmission) { this.daysToSubmission = daysToSubmission; }
    public Boolean getDocumentationComplete() { return documentationComplete; }
    public void setDocumentationComplete(Boolean documentationComplete) { this.documentationComplete = documentationComplete; }
    public String getClaimType() { return claimType; }
    public void setClaimType(String claimType) { this.claimType = claimType; }
    public String getPolicyType() { return policyType; }
    public void setPolicyType(String policyType) { this.policyType = policyType; }
    public BigDecimal getCoverageLimit() { return coverageLimit; }
    public void setCoverageLimit(BigDecimal coverageLimit) { this.coverageLimit = coverageLimit; }
    public BigDecimal getDeductibleAmount() { return deductibleAmount; }
    public void setDeductibleAmount(BigDecimal deductibleAmount) { this.deductibleAmount = deductibleAmount; }
    public Boolean getPreauthorizationRequired() { return preauthorizationRequired; }
    public void setPreauthorizationRequired(Boolean preauthorizationRequired) { this.preauthorizationRequired = preauthorizationRequired; }
    public Boolean getPreauthorizationObtained() { return preauthorizationObtained; }
    public void setPreauthorizationObtained(Boolean preauthorizationObtained) { this.preauthorizationObtained = preauthorizationObtained; }
    public Integer getPatientAge() { return patientAge; }
    public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }
    public String getPatientGender() { return patientGender; }
    public void setPatientGender(String patientGender) { this.patientGender = patientGender; }
    public Boolean getChronicConditionFlag() { return chronicConditionFlag; }
    public void setChronicConditionFlag(Boolean chronicConditionFlag) { this.chronicConditionFlag = chronicConditionFlag; }
    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }
    public String getHospitalTier() { return hospitalTier; }
    public void setHospitalTier(String hospitalTier) { this.hospitalTier = hospitalTier; }
    public BigDecimal getHospitalClaimSuccessRate() { return hospitalClaimSuccessRate; }
    public void setHospitalClaimSuccessRate(BigDecimal hospitalClaimSuccessRate) { this.hospitalClaimSuccessRate = hospitalClaimSuccessRate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
