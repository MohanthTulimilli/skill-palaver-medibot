package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "claim_id", length = 36)
    private String claimId;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "payment_status", nullable = false, length = 32)
    private String paymentStatus = "UNPAID";
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "days_to_payment")
    private Integer daysToPayment;
    @Column(name = "payment_delay_flag")
    private Boolean paymentDelayFlag;
    @Column(name = "payer_type", length = 50)
    private String payerType;
    @Column(name = "invoice_category", length = 50)
    private String invoiceCategory;
    @Column(name = "reminder_count")
    private Integer reminderCount;
    @Column(name = "installment_plan")
    private Boolean installmentPlan;
    @Column(name = "historical_avg_payment_delay")
    private Integer historicalAvgPaymentDelay;
    @Column(name = "patient_age")
    private Integer patientAge;
    @Column(name = "patient_gender", length = 20)
    private String patientGender;
    @Column(name = "previous_late_payments")
    private Integer previousLatePayments;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (invoiceNumber == null) invoiceNumber = "INV-" + id.substring(0, 8);
        if (dueDate == null) dueDate = LocalDate.now().plusDays(30);
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getClaimId() { return claimId; }
    public void setClaimId(String claimId) { this.claimId = claimId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public Integer getDaysToPayment() { return daysToPayment; }
    public void setDaysToPayment(Integer daysToPayment) { this.daysToPayment = daysToPayment; }
    public Boolean getPaymentDelayFlag() { return paymentDelayFlag; }
    public void setPaymentDelayFlag(Boolean paymentDelayFlag) { this.paymentDelayFlag = paymentDelayFlag; }
    public String getPayerType() { return payerType; }
    public void setPayerType(String payerType) { this.payerType = payerType; }
    public String getInvoiceCategory() { return invoiceCategory; }
    public void setInvoiceCategory(String invoiceCategory) { this.invoiceCategory = invoiceCategory; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
    public Boolean getInstallmentPlan() { return installmentPlan; }
    public void setInstallmentPlan(Boolean installmentPlan) { this.installmentPlan = installmentPlan; }
    public Integer getHistoricalAvgPaymentDelay() { return historicalAvgPaymentDelay; }
    public void setHistoricalAvgPaymentDelay(Integer historicalAvgPaymentDelay) { this.historicalAvgPaymentDelay = historicalAvgPaymentDelay; }
    public Integer getPatientAge() { return patientAge; }
    public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }
    public String getPatientGender() { return patientGender; }
    public void setPatientGender(String patientGender) { this.patientGender = patientGender; }
    public Integer getPreviousLatePayments() { return previousLatePayments; }
    public void setPreviousLatePayments(Integer previousLatePayments) { this.previousLatePayments = previousLatePayments; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
