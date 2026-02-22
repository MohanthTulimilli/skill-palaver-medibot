package com.medibots.controller;

import com.medibots.entity.Appointment;
import com.medibots.entity.AppointmentFeatures;
import com.medibots.entity.Patient;
import com.medibots.repository.AppointmentFeaturesRepository;
import com.medibots.repository.AppointmentRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.repository.ProfileRepository;
import com.medibots.repository.UserRoleRepository;
import com.medibots.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentsController {
    private final AppointmentRepository appointmentRepo;
    private final UserRoleRepository userRoleRepo;
    private final PatientRepository patientRepo;
    private final ProfileRepository profileRepo;
    private final AppointmentFeaturesRepository appointmentFeaturesRepo;
    private final MlPredictionService mlService;

    public AppointmentsController(AppointmentRepository appointmentRepo, UserRoleRepository userRoleRepo, PatientRepository patientRepo, ProfileRepository profileRepo,
                                  AppointmentFeaturesRepository appointmentFeaturesRepo, MlPredictionService mlService) {
        this.appointmentRepo = appointmentRepo;
        this.userRoleRepo = userRoleRepo;
        this.patientRepo = patientRepo;
        this.profileRepo = profileRepo;
        this.appointmentFeaturesRepo = appointmentFeaturesRepo;
        this.mlService = mlService;
    }

    @GetMapping("/doctor")
    public ResponseEntity<List<Map<String, Object>>> doctorList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        List<Appointment> list = appointmentRepo.findByDoctorIdOrderByAppointmentDateDesc(auth.getName());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Appointment a : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("patient_id", a.getPatientId());
            m.put("doctor_id", a.getDoctorId());
            m.put("status", a.getStatus());
            m.put("appointment_date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
            m.put("reason", a.getReason());
            m.put("consultation_fee", a.getConsultationFee());
            m.put("fee_paid", a.getFeePaid());
            m.put("hospital_id", a.getHospitalId());
            m.put("booking_lead_time_days", a.getBookingLeadTimeDays());
            m.put("previous_no_show_count", a.getPreviousNoShowCount());
            m.put("sms_reminder_sent", a.getSmsReminderSent());
            m.put("reminder_count", a.getReminderCount());
            m.put("appointment_type", a.getAppointmentType());
            m.put("distance_from_hospital_km", a.getDistanceFromHospitalKm());
            m.put("time_slot", a.getTimeSlot());
            m.put("weekday", a.getWeekday());
            m.put("no_show_flag", a.getNoShowFlag());
            m.put("patient_age", a.getPatientAge());
            m.put("patient_gender", a.getPatientGender());
            m.put("previous_late_payments", a.getPreviousLatePayments());
            m.put("created_at", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            appointmentFeaturesRepo.findByAppointmentId(a.getId()).ifPresent(f -> addPredictionToMap(m, f));
            Map<String, Object> patientMap = new HashMap<>();
            String displayName = "Patient";
            var patientOpt = patientRepo.findById(a.getPatientId());
            if (patientOpt.isPresent()) {
                Patient p = patientOpt.get();
                if (p.getFullName() != null && !p.getFullName().isBlank()) {
                    displayName = p.getFullName().trim();
                } else {
                    displayName = profileRepo.findByUserId(p.getUserId())
                            .map(pr -> (pr.getName() != null && !pr.getName().isBlank()) ? pr.getName().trim() : "Patient")
                            .orElse("Patient");
                }
            }
            patientMap.put("full_name", displayName);
            patientMap.put("fullName", displayName);
            m.put("patients", patientMap);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientList(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        var patient = patientRepo.findByUserId(auth.getName());
        if (patient.isEmpty()) return ResponseEntity.ok(List.of());
        List<Appointment> list = appointmentRepo.findByPatientIdOrderByAppointmentDateDesc(patient.get().getId());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Appointment a : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("patient_id", a.getPatientId());
            m.put("doctor_id", a.getDoctorId());
            m.put("status", a.getStatus());
            m.put("appointment_date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
            m.put("reason", a.getReason());
            m.put("consultation_fee", a.getConsultationFee());
            m.put("fee_paid", a.getFeePaid());
            m.put("hospital_id", a.getHospitalId());
            m.put("booking_lead_time_days", a.getBookingLeadTimeDays());
            m.put("previous_no_show_count", a.getPreviousNoShowCount());
            m.put("sms_reminder_sent", a.getSmsReminderSent());
            m.put("reminder_count", a.getReminderCount());
            m.put("appointment_type", a.getAppointmentType());
            m.put("distance_from_hospital_km", a.getDistanceFromHospitalKm());
            m.put("time_slot", a.getTimeSlot());
            m.put("weekday", a.getWeekday());
            m.put("no_show_flag", a.getNoShowFlag());
            m.put("patient_age", a.getPatientAge());
            m.put("patient_gender", a.getPatientGender());
            m.put("previous_late_payments", a.getPreviousLatePayments());
            m.put("created_at", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            appointmentFeaturesRepo.findByAppointmentId(a.getId()).ifPresent(f -> addPredictionToMap(m, f));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /** Returns completed appointments with patient & doctor info for claims creation. */
    @GetMapping("/for-claims")
    public ResponseEntity<List<Map<String, Object>>> forClaims(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        List<Appointment> list = appointmentRepo.findByStatusOrderByAppointmentDateDesc("COMPLETED");
        List<Map<String, Object>> out = new ArrayList<>();
        for (Appointment a : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("patient_id", a.getPatientId());
            m.put("doctor_id", a.getDoctorId());
            m.put("status", a.getStatus());
            m.put("appointment_date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
            m.put("appointmentDate", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
            m.put("reason", a.getReason());
            m.put("consultation_fee", a.getConsultationFee());
            m.put("fee_paid", a.getFeePaid());
            m.put("hospital_id", a.getHospitalId());
            m.put("booking_lead_time_days", a.getBookingLeadTimeDays());
            m.put("previous_no_show_count", a.getPreviousNoShowCount());
            m.put("sms_reminder_sent", a.getSmsReminderSent());
            m.put("reminder_count", a.getReminderCount());
            m.put("appointment_type", a.getAppointmentType());
            m.put("distance_from_hospital_km", a.getDistanceFromHospitalKm());
            m.put("time_slot", a.getTimeSlot());
            m.put("weekday", a.getWeekday());
            m.put("no_show_flag", a.getNoShowFlag());
            m.put("patient_age", a.getPatientAge());
            m.put("patient_gender", a.getPatientGender());
            m.put("previous_late_payments", a.getPreviousLatePayments());
            m.put("created_at", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            appointmentFeaturesRepo.findByAppointmentId(a.getId()).ifPresent(f -> addPredictionToMap(m, f));
            Map<String, Object> patientMap = new HashMap<>();
            String patientName = "Patient";
            String insuranceProvider = "N/A";
            var patientOpt = patientRepo.findById(a.getPatientId());
            if (patientOpt.isPresent()) {
                Patient p = patientOpt.get();
                if (p.getFullName() != null && !p.getFullName().isBlank()) patientName = p.getFullName().trim();
                else patientName = profileRepo.findByUserId(p.getUserId()).map(pr -> (pr.getName() != null && !pr.getName().isBlank()) ? pr.getName().trim() : "Patient").orElse("Patient");
                if (p.getInsuranceProvider() != null && !p.getInsuranceProvider().isBlank()) insuranceProvider = p.getInsuranceProvider();
            }
            patientMap.put("full_name", patientName);
            patientMap.put("fullName", patientName);
            patientMap.put("insurance_provider", insuranceProvider);
            m.put("patients", patientMap);
            String doctorName = profileRepo.findByUserId(a.getDoctorId())
                    .map(pr -> (pr.getName() != null && !pr.getName().isBlank()) ? pr.getName().trim() : "Doctor")
                    .or(() -> profileRepo.findById(a.getDoctorId()).map(pr -> (pr.getName() != null && !pr.getName().isBlank()) ? pr.getName().trim() : "Doctor"))
                    .orElse("Doctor");
            m.put("doctors", Map.of("name", doctorName));
            m.put("doctor_name", doctorName);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> list(Authentication auth) {
        String uid = auth != null ? auth.getName() : null;
        if (uid != null && userRoleRepo.findByUserId(uid).map(ur -> "DOCTOR".equals(ur.getRole())).orElse(false))
            return doctorList(auth);
        return ResponseEntity.ok(appointmentRepo.findAllByOrderByAppointmentDateDesc());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Appointment a = new Appointment();
        a.setPatientId((String) body.get("patient_id"));
        a.setDoctorId((String) body.get("doctor_id"));
        a.setStatus("PENDING");
        if (body.get("appointment_date") != null)
            a.setAppointmentDate(Instant.parse(body.get("appointment_date").toString()));
        a.setReason((String) body.get("reason"));
        if (body.get("hospital_id") != null) a.setHospitalId((String) body.get("hospital_id"));
        if (body.get("consultation_fee") != null) a.setConsultationFee(new java.math.BigDecimal(body.get("consultation_fee").toString()));
        if (body.get("fee_paid") != null) a.setFeePaid(Boolean.TRUE.equals(body.get("fee_paid")));
        applyAppointmentExtras(a, body);
        a = appointmentRepo.save(a);
        runMlAndSaveFeatures(a);
        return ResponseEntity.ok(toMapWithPrediction(a));
    }

    private void runMlAndSaveFeatures(Appointment a) {
        Map<String, Object> features = appointmentToFeaturesMap(a);
        MlPredictionService.PredictionResult pred = mlService.predictNoShow(features);
        AppointmentFeatures f = appointmentFeaturesRepo.findByAppointmentId(a.getId()).orElse(new AppointmentFeatures());
        f.setAppointmentId(a.getId());
        f.setNoShowRiskScore(java.math.BigDecimal.valueOf(pred.probability()));
        f.setMlPrediction(pred.prediction());
        f.setMlProbability(java.math.BigDecimal.valueOf(pred.probability()));
        appointmentFeaturesRepo.save(f);
    }

    private Map<String, Object> appointmentToFeaturesMap(Appointment a) {
        Map<String, Object> m = new HashMap<>();
        m.put("booking_lead_time_days", a.getBookingLeadTimeDays());
        m.put("appointment_type", a.getAppointmentType());
        m.put("time_slot", a.getTimeSlot());
        m.put("weekday", a.getWeekday());
        m.put("previous_no_show_count", a.getPreviousNoShowCount());
        m.put("reminder_count", a.getReminderCount());
        m.put("sms_reminder_sent", a.getSmsReminderSent());
        m.put("distance_from_hospital_km", a.getDistanceFromHospitalKm());
        m.put("patient_age", a.getPatientAge());
        m.put("patient_gender", a.getPatientGender());
        m.put("consultation_fee", a.getConsultationFee());
        m.put("previous_late_payments", a.getPreviousLatePayments());
        return m;
    }

    private void addPredictionToMap(Map<String, Object> m, AppointmentFeatures f) {
        if (f.getMlPrediction() != null) m.put("ml_no_show_prediction", f.getMlPrediction());
        if (f.getMlProbability() != null) m.put("ml_no_show_probability", f.getMlProbability().doubleValue());
    }

    private Map<String, Object> toMapWithPrediction(Appointment a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("patient_id", a.getPatientId());
        m.put("doctor_id", a.getDoctorId());
        m.put("status", a.getStatus());
        m.put("appointment_date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
        m.put("reason", a.getReason());
        m.put("consultation_fee", a.getConsultationFee());
        m.put("fee_paid", a.getFeePaid());
        m.put("hospital_id", a.getHospitalId());
        m.put("booking_lead_time_days", a.getBookingLeadTimeDays());
        m.put("previous_no_show_count", a.getPreviousNoShowCount());
        m.put("sms_reminder_sent", a.getSmsReminderSent());
        m.put("reminder_count", a.getReminderCount());
        m.put("appointment_type", a.getAppointmentType());
        m.put("distance_from_hospital_km", a.getDistanceFromHospitalKm());
        m.put("time_slot", a.getTimeSlot());
        m.put("weekday", a.getWeekday());
        m.put("no_show_flag", a.getNoShowFlag());
        m.put("patient_age", a.getPatientAge());
        m.put("patient_gender", a.getPatientGender());
        m.put("previous_late_payments", a.getPreviousLatePayments());
        m.put("created_at", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
        appointmentFeaturesRepo.findByAppointmentId(a.getId()).ifPresent(f -> addPredictionToMap(m, f));
        return m;
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Appointment> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Appointment a = appointmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found"));
        if (body.get("status") != null) a.setStatus((String) body.get("status"));
        applyAppointmentExtras(a, body);
        a = appointmentRepo.save(a);
        return ResponseEntity.ok(a);
    }

    private void applyAppointmentExtras(Appointment a, Map<String, ?> body) {
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
