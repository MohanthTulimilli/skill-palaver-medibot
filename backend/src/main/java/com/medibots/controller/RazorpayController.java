package com.medibots.controller;

import com.medibots.entity.Appointment;
import com.medibots.entity.Invoice;
import com.medibots.entity.InvoiceItem;
import com.medibots.entity.Payment;
import com.medibots.repository.AppointmentRepository;
import com.medibots.repository.DoctorRecommendationRepository;
import com.medibots.repository.InvoiceItemRepository;
import com.medibots.repository.InvoiceRepository;
import com.medibots.repository.PaymentRepository;
import com.medibots.service.RazorpayService;
import com.razorpay.RazorpayException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;

import com.medibots.entity.Patient;
import com.medibots.repository.PatientRepository;

@RestController
@RequestMapping("/api/razorpay")
public class RazorpayController {

    private final RazorpayService razorpayService;
    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository invoiceItemRepo;
    private final PaymentRepository paymentRepo;
    private final AppointmentRepository appointmentRepo;
    private final DoctorRecommendationRepository recRepo;
    private final PatientRepository patientRepo;

    public RazorpayController(RazorpayService razorpayService,
                              InvoiceRepository invoiceRepo,
                              InvoiceItemRepository invoiceItemRepo,
                              PaymentRepository paymentRepo,
                              AppointmentRepository appointmentRepo,
                              DoctorRecommendationRepository recRepo,
                              PatientRepository patientRepo) {
        this.razorpayService = razorpayService;
        this.invoiceRepo = invoiceRepo;
        this.invoiceItemRepo = invoiceItemRepo;
        this.paymentRepo = paymentRepo;
        this.appointmentRepo = appointmentRepo;
        this.recRepo = recRepo;
        this.patientRepo = patientRepo;
    }

    private void populateAppointmentFromPatientIfMissing(Appointment a) {
        if (a.getPatientId() == null) return;
        patientRepo.findById(a.getPatientId()).ifPresent(p -> {
            if (a.getPatientAge() == null && p.getDob() != null)
                a.setPatientAge(Period.between(p.getDob(), LocalDate.now()).getYears());
            if (a.getPatientGender() == null && p.getGender() != null)
                a.setPatientGender(p.getGender());
        });
        if (a.getPreviousLatePayments() == null && a.getPatientId() != null) {
            int count = 0;
            for (Invoice i : invoiceRepo.findByPatientIdOrderByCreatedAtDesc(a.getPatientId())) {
                if (!"PAID".equals(i.getPaymentStatus())) continue;
                for (var pmt : paymentRepo.findByInvoiceId(i.getId())) {
                    if (pmt.getPaymentDate() != null && i.getDueDate() != null
                            && pmt.getPaymentDate().isAfter(i.getDueDate())) {
                        count++;
                        break;
                    }
                }
            }
            a.setPreviousLatePayments(count);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        Map<String, Object> m = new HashMap<>();
        m.put("enabled", razorpayService.isConfigured());
        return ResponseEntity.ok(m);
    }

    /**
     * Create Razorpay order for an invoice.
     * Body: { invoice_id, amount } — amount in INR (will be converted to paise).
     */
    @PostMapping("/order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (!razorpayService.isConfigured()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."));
        }
        String invoiceId = body.get("invoice_id") != null ? body.get("invoice_id").toString().trim() : null;
        if (invoiceId != null && invoiceId.isEmpty()) invoiceId = null;
        Object amt = body.get("amount");
        double amountInr = amt != null ? Double.parseDouble(amt.toString()) : 0;
        if (amountInr <= 0 && (invoiceId == null || invoiceId.isBlank())) {
            return ResponseEntity.badRequest().body(Map.of("error", "amount or invoice_id is required"));
        }
        if (amountInr <= 0) {
            Invoice inv = invoiceRepo.findById(invoiceId).orElse(null);
            if (inv != null) amountInr = inv.getTotalAmount().doubleValue();
            else return ResponseEntity.badRequest().body(Map.of("error", "amount is required"));
        }
        long amountPaise = Math.round(amountInr * 100);
        if (amountPaise < 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "Minimum amount is ₹1"));
        }
        try {
            String receipt = invoiceId != null ? "inv_" + invoiceId.substring(0, Math.min(8, invoiceId.length())) : "book_" + System.currentTimeMillis();
            Map<String, Object> order = razorpayService.createOrder(amountPaise, receipt, invoiceId);
            return ResponseEntity.ok(order);
        } catch (RazorpayException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verify Razorpay payment and record it.
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id }
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String orderId = (String) body.get("razorpay_order_id");
        String paymentId = (String) body.get("razorpay_payment_id");
        String signature = (String) body.get("razorpay_signature");
        String invoiceId = (String) body.get("invoice_id");
        if (orderId == null || paymentId == null || signature == null || invoiceId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id are required"));
        }
        if (!razorpayService.verifyPayment(orderId, paymentId, signature)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment verification failed"));
        }
        Invoice inv = invoiceRepo.findById(invoiceId).orElse(null);
        if (inv == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invoice not found"));
        }
        BigDecimal amount = inv.getTotalAmount();
        Payment p = new Payment();
        p.setInvoiceId(invoiceId);
        p.setAmountPaid(amount);
        p.setPaymentMethod("Razorpay");
        p.setTransactionId(paymentId);
        p.setPaidBy(auth.getName());
        p = paymentRepo.save(p);
        inv.setPaymentStatus("PAID");
        invoiceRepo.save(inv);
        for (InvoiceItem item : invoiceItemRepo.findByInvoiceIdOrderByCreatedAtAsc(invoiceId)) {
            if (item.getRecommendationId() != null) {
                recRepo.findById(item.getRecommendationId()).ifPresent(r -> {
                    r.setStatus("PAID");
                    recRepo.save(r);
                });
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("success", true);
        out.put("payment", Map.of(
                "id", p.getId(),
                "invoice_id", p.getInvoiceId(),
                "amount_paid", p.getAmountPaid(),
                "payment_method", p.getPaymentMethod(),
                "transaction_id", p.getTransactionId(),
                "paid_by", p.getPaidBy()
        ));
        return ResponseEntity.ok(out);
    }

    /**
     * Verify Razorpay payment for a booking (consultation) and create appointment + invoice + payment.
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, patient_id, doctor_id, appointment_date, reason, hospital_id, amount, doctor_name }
     */
    @PostMapping("/verify-booking")
    public ResponseEntity<Map<String, Object>> verifyBooking(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String orderId = (String) body.get("razorpay_order_id");
        String paymentId = (String) body.get("razorpay_payment_id");
        String signature = (String) body.get("razorpay_signature");
        String patientId = (String) body.get("patient_id");
        String doctorId = (String) body.get("doctor_id");
        String appointmentDateStr = (String) body.get("appointment_date");
        String reason = (String) body.get("reason");
        String hospitalId = body.get("hospital_id") != null ? body.get("hospital_id").toString() : null;
        Object amt = body.get("amount");
        String doctorName = (String) body.get("doctor_name");

        if (orderId == null || paymentId == null || signature == null || patientId == null || doctorId == null || appointmentDateStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "razorpay_order_id, razorpay_payment_id, razorpay_signature, patient_id, doctor_id, appointment_date are required"));
        }
        if (!razorpayService.verifyPayment(orderId, paymentId, signature)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment verification failed"));
        }

        double amountInr = amt != null ? Double.parseDouble(amt.toString()) : 0;
        if (amountInr <= 0) amountInr = 150; // default consultation fee
        BigDecimal amount = BigDecimal.valueOf(amountInr);

        // Create appointment
        Appointment appt = new Appointment();
        appt.setPatientId(patientId);
        appt.setDoctorId(doctorId);
        appt.setStatus("PENDING");
        appt.setAppointmentDate(Instant.parse(appointmentDateStr));
        appt.setReason(reason);
        appt.setHospitalId(hospitalId);
        appt.setConsultationFee(amount);
        appt.setFeePaid(true);
        applyAppointmentExtras(appt, body);
        populateAppointmentFromPatientIfMissing(appt);
        appt = appointmentRepo.save(appt);

        // Create invoice
        Invoice inv = new Invoice();
        inv.setPatientId(patientId);
        inv.setTotalAmount(amount);
        inv.setHospitalId(hospitalId);
        inv.setPaymentStatus("PAID");
        inv.setDueDate(LocalDate.now().plusDays(30));
        inv = invoiceRepo.save(inv);

        InvoiceItem item = new InvoiceItem();
        item.setInvoiceId(inv.getId());
        item.setDescription("Consultation Fee — Dr. " + (doctorName != null ? doctorName : "Doctor"));
        item.setAmount(amount);
        item.setItemType("CONSULTATION");
        invoiceItemRepo.save(item);

        // Record payment
        Payment p = new Payment();
        p.setInvoiceId(inv.getId());
        p.setAmountPaid(amount);
        p.setPaymentMethod("Razorpay");
        p.setTransactionId(paymentId);
        p.setPaidBy(auth.getName());
        paymentRepo.save(p);

        Map<String, Object> out = new HashMap<>();
        out.put("success", true);
        out.put("appointment", Map.of("id", appt.getId(), "doctor_id", appt.getDoctorId(), "appointment_date", appt.getAppointmentDate(), "status", appt.getStatus()));
        out.put("invoice", Map.of("id", inv.getId(), "invoice_number", inv.getInvoiceNumber(), "total_amount", inv.getTotalAmount()));
        return ResponseEntity.ok(out);
    }

    private void applyAppointmentExtras(Appointment a, Map<String, Object> body) {
        if (body.get("booking_lead_time_days") != null) a.setBookingLeadTimeDays(intFrom(body.get("booking_lead_time_days")));
        if (body.get("previous_no_show_count") != null) a.setPreviousNoShowCount(intFrom(body.get("previous_no_show_count")));
        if (body.get("sms_reminder_sent") != null) a.setSmsReminderSent(Boolean.TRUE.equals(body.get("sms_reminder_sent")));
        if (body.get("reminder_count") != null) a.setReminderCount(intFrom(body.get("reminder_count")));
        if (body.get("appointment_type") != null) a.setAppointmentType((String) body.get("appointment_type"));
        if (body.get("distance_from_hospital_km") != null) a.setDistanceFromHospitalKm(new BigDecimal(body.get("distance_from_hospital_km").toString()));
        if (body.get("time_slot") != null) a.setTimeSlot((String) body.get("time_slot"));
        if (body.get("weekday") != null) a.setWeekday((String) body.get("weekday"));
        if (body.get("no_show_flag") != null) a.setNoShowFlag(Boolean.TRUE.equals(body.get("no_show_flag")));
        if (body.get("patient_age") != null) a.setPatientAge(intFrom(body.get("patient_age")));
        if (body.get("patient_gender") != null) a.setPatientGender((String) body.get("patient_gender"));
        if (body.get("previous_late_payments") != null) a.setPreviousLatePayments(intFrom(body.get("previous_late_payments")));
    }

    private static Integer intFrom(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        return Integer.parseInt(o.toString());
    }
}
