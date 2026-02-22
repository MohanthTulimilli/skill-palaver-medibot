package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;
    @Column(name = "doctor_id", nullable = false, length = 36)
    private String doctorId;
    @Column(nullable = false, length = 32)
    private String status = "PENDING";
    @Column(name = "appointment_date", nullable = false)
    private Instant appointmentDate;
    private String reason;
    private String notes;
    @Column(name = "consultation_fee", precision = 12, scale = 2)
    private BigDecimal consultationFee;
    @Column(name = "fee_paid")
    private Boolean feePaid;
    @Column(name = "hospital_id", length = 36)
    private String hospitalId;
    @Column(name = "booking_lead_time_days")
    private Integer bookingLeadTimeDays;
    @Column(name = "previous_no_show_count")
    private Integer previousNoShowCount;
    @Column(name = "sms_reminder_sent")
    private Boolean smsReminderSent;
    @Column(name = "reminder_count")
    private Integer reminderCount;
    @Column(name = "appointment_type", length = 50)
    private String appointmentType;
    @Column(name = "distance_from_hospital_km", precision = 5, scale = 2)
    private BigDecimal distanceFromHospitalKm;
    @Column(name = "time_slot", length = 20)
    private String timeSlot;
    @Column(name = "weekday", length = 20)
    private String weekday;
    @Column(name = "no_show_flag")
    private Boolean noShowFlag;
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(Instant appointmentDate) { this.appointmentDate = appointmentDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
    public Boolean getFeePaid() { return feePaid; }
    public void setFeePaid(Boolean feePaid) { this.feePaid = feePaid; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public Integer getBookingLeadTimeDays() { return bookingLeadTimeDays; }
    public void setBookingLeadTimeDays(Integer bookingLeadTimeDays) { this.bookingLeadTimeDays = bookingLeadTimeDays; }
    public Integer getPreviousNoShowCount() { return previousNoShowCount; }
    public void setPreviousNoShowCount(Integer previousNoShowCount) { this.previousNoShowCount = previousNoShowCount; }
    public Boolean getSmsReminderSent() { return smsReminderSent; }
    public void setSmsReminderSent(Boolean smsReminderSent) { this.smsReminderSent = smsReminderSent; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
    public String getAppointmentType() { return appointmentType; }
    public void setAppointmentType(String appointmentType) { this.appointmentType = appointmentType; }
    public BigDecimal getDistanceFromHospitalKm() { return distanceFromHospitalKm; }
    public void setDistanceFromHospitalKm(BigDecimal distanceFromHospitalKm) { this.distanceFromHospitalKm = distanceFromHospitalKm; }
    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
    public String getWeekday() { return weekday; }
    public void setWeekday(String weekday) { this.weekday = weekday; }
    public Boolean getNoShowFlag() { return noShowFlag; }
    public void setNoShowFlag(Boolean noShowFlag) { this.noShowFlag = noShowFlag; }
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
