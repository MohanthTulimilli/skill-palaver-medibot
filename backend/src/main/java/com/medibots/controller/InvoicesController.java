package com.medibots.controller;

import com.medibots.entity.Claim;
import com.medibots.entity.DoctorRecommendation;
import com.medibots.entity.Invoice;
import com.medibots.entity.InvoiceItem;
import com.medibots.entity.Patient;
import com.medibots.entity.ServiceCatalog;
import com.medibots.repository.ClaimRepository;
import com.medibots.repository.DoctorRecommendationRepository;
import com.medibots.repository.InvoiceRepository;
import com.medibots.repository.InvoiceItemRepository;
import com.medibots.repository.PatientRepository;
import com.medibots.repository.InvoiceFeaturesRepository;
import com.medibots.repository.PaymentRepository;
import com.medibots.repository.ServiceCatalogRepository;
import com.medibots.entity.InvoiceFeatures;
import com.medibots.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoicesController {
    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository itemRepo;
    private final PatientRepository patientRepo;
    private final ClaimRepository claimRepo;
    private final DoctorRecommendationRepository recRepo;
    private final ServiceCatalogRepository catalogRepo;
    private final PaymentRepository paymentRepo;
    private final InvoiceFeaturesRepository invoiceFeaturesRepo;
    private final MlPredictionService mlService;

    public InvoicesController(InvoiceRepository invoiceRepo, InvoiceItemRepository itemRepo, PatientRepository patientRepo,
                              ClaimRepository claimRepo, DoctorRecommendationRepository recRepo, ServiceCatalogRepository catalogRepo,
                              PaymentRepository paymentRepo, InvoiceFeaturesRepository invoiceFeaturesRepo, MlPredictionService mlService) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.patientRepo = patientRepo;
        this.claimRepo = claimRepo;
        this.recRepo = recRepo;
        this.catalogRepo = catalogRepo;
        this.paymentRepo = paymentRepo;
        this.invoiceFeaturesRepo = invoiceFeaturesRepo;
        this.mlService = mlService;
    }

    private void populateFromPatientIfMissing(Invoice inv) {
        if (inv.getPatientId() == null) return;
        patientRepo.findById(inv.getPatientId()).ifPresent(p -> {
            if (inv.getPatientAge() == null && p.getDob() != null)
                inv.setPatientAge(Period.between(p.getDob(), LocalDate.now()).getYears());
            if (inv.getPatientGender() == null && p.getGender() != null)
                inv.setPatientGender(p.getGender());
        });
        if (inv.getPreviousLatePayments() == null) {
            int count = 0;
            for (Invoice i : invoiceRepo.findByPatientIdOrderByCreatedAtDesc(inv.getPatientId())) {
                if (!"PAID".equals(i.getPaymentStatus())) continue;
                for (var pmt : paymentRepo.findByInvoiceId(i.getId())) {
                    if (pmt.getPaymentDate() != null && i.getDueDate() != null
                            && pmt.getPaymentDate().isAfter(i.getDueDate())) {
                        count++;
                        break;
                    }
                }
            }
            inv.setPreviousLatePayments(count);
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        List<Invoice> all = invoiceRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Invoice i : all) {
            Map<String, Object> m = toMap(i);
            invoiceFeaturesRepo.findByInvoiceId(i.getId()).ifPresent(f -> addPredictionToMap(m, f));
            patientRepo.findById(i.getPatientId()).ifPresent(p -> m.put("patients", Map.of("full_name", p.getFullName(), "user_id", p.getUserId())));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Map<String, Object>>> patientInvoices(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Patient p = patientRepo.findByUserId(auth.getName()).orElse(null);
        if (p == null) return ResponseEntity.ok(List.of());
        List<Invoice> list = invoiceRepo.findByPatientIdOrderByCreatedAtDesc(p.getId());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Invoice i : list) {
            Map<String, Object> m = toMap(i);
            invoiceFeaturesRepo.findByInvoiceId(i.getId()).ifPresent(f -> addPredictionToMap(m, f));
            m.put("patients", Map.of("full_name", p.getFullName(), "user_id", p.getUserId()));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<InvoiceItem>> items(@PathVariable String id) {
        return ResponseEntity.ok(itemRepo.findByInvoiceIdOrderByCreatedAtAsc(id));
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createInvoice(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String patientId = (String) body.get("patient_id");
        if (patientId == null) throw new RuntimeException("patient_id required");
        Invoice inv = new Invoice();
        inv.setPatientId(patientId);
        inv.setTotalAmount(body.get("total_amount") != null ? new BigDecimal(body.get("total_amount").toString()) : BigDecimal.ZERO);
        if (body.get("hospital_id") != null) inv.setHospitalId((String) body.get("hospital_id"));
        inv.setPaymentStatus(body.get("payment_status") != null ? (String) body.get("payment_status") : "UNPAID");
        if (inv.getDueDate() == null) inv.setDueDate(LocalDate.now().plusDays(30));
        applyInvoiceExtras(inv, body);
        populateFromPatientIfMissing(inv);
        inv = invoiceRepo.save(inv);
        runMlAndSaveFeatures(inv);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lineItems = (List<Map<String, Object>>) body.get("line_items");
        if (lineItems != null) {
            for (Map<String, Object> li : lineItems) {
                InvoiceItem item = new InvoiceItem();
                item.setInvoiceId(inv.getId());
                item.setDescription((String) li.get("description"));
                item.setAmount(li.get("amount") != null ? new BigDecimal(li.get("amount").toString()) : BigDecimal.ZERO);
                item.setItemType((String) li.getOrDefault("item_type", "CONSULTATION"));
                itemRepo.save(item);
            }
        }
        Map<String, Object> m = toMap(inv);
        invoiceFeaturesRepo.findByInvoiceId(inv.getId()).ifPresent(f -> addPredictionToMap(m, f));
        patientRepo.findById(inv.getPatientId()).ifPresent(p -> m.put("patients", Map.of("full_name", p.getFullName(), "user_id", p.getUserId())));
        return ResponseEntity.ok(m);
    }

    private void runMlAndSaveFeatures(Invoice inv) {
        Map<String, Object> features = invoiceToFeaturesMap(inv);
        MlPredictionService.PredictionResult pred = mlService.predictPaymentDelay(features);
        InvoiceFeatures f = invoiceFeaturesRepo.findByInvoiceId(inv.getId()).orElse(new InvoiceFeatures());
        f.setInvoiceId(inv.getId());
        f.setPaymentDelayScore(java.math.BigDecimal.valueOf(pred.probability()));
        f.setMlPrediction(pred.prediction());
        f.setMlProbability(java.math.BigDecimal.valueOf(pred.probability()));
        invoiceFeaturesRepo.save(f);
    }

    private Map<String, Object> invoiceToFeaturesMap(Invoice inv) {
        Map<String, Object> m = new HashMap<>();
        m.put("total_amount", inv.getTotalAmount());
        m.put("days_to_payment", inv.getDaysToPayment());
        m.put("payer_type", inv.getPayerType());
        m.put("invoice_category", inv.getInvoiceCategory());
        m.put("reminder_count", inv.getReminderCount());
        m.put("installment_plan", inv.getInstallmentPlan());
        m.put("historical_avg_payment_delay", inv.getHistoricalAvgPaymentDelay());
        m.put("patient_age", inv.getPatientAge());
        m.put("patient_gender", inv.getPatientGender());
        m.put("previous_late_payments", inv.getPreviousLatePayments());
        m.put("payment_status", inv.getPaymentStatus());
        return m;
    }

    private void addPredictionToMap(Map<String, Object> m, InvoiceFeatures f) {
        if (f.getMlPrediction() != null) m.put("ml_payment_delay_prediction", f.getMlPrediction());
        if (f.getMlProbability() != null) m.put("ml_payment_delay_probability", f.getMlProbability().doubleValue());
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String claimId = (String) body.get("claim_id");
        String patientId = (String) body.get("patient_id");
        if (patientId == null && claimId != null) {
            patientId = claimRepo.findById(claimId).map(Claim::getPatientId).orElse(null);
        }
        if (patientId == null)
            throw new RuntimeException("patient_id or claim_id required");
        Invoice inv = new Invoice();
        inv.setClaimId(claimId);
        inv.setPatientId(patientId);
        inv.setTotalAmount(body.get("total_amount") != null ? new BigDecimal(body.get("total_amount").toString()) : BigDecimal.ZERO);
        inv.setDueDate(LocalDate.now().plusDays(30));
        if (body.get("hospital_id") != null) inv.setHospitalId((String) body.get("hospital_id"));
        applyInvoiceExtras(inv, body);
        populateFromPatientIfMissing(inv);
        inv = invoiceRepo.save(inv);
        runMlAndSaveFeatures(inv);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lineItems = (List<Map<String, Object>>) body.get("line_items");
        if (lineItems != null) {
            for (Map<String, Object> li : lineItems) {
                InvoiceItem item = new InvoiceItem();
                item.setInvoiceId(inv.getId());
                item.setDescription((String) li.get("description"));
                item.setAmount(li.get("amount") != null ? new BigDecimal(li.get("amount").toString()) : BigDecimal.ZERO);
                item.setItemType((String) li.getOrDefault("item_type", "CONSULTATION"));
                if (li.get("recommendation_id") != null) item.setRecommendationId((String) li.get("recommendation_id"));
                if (li.get("service_catalog_id") != null) item.setServiceCatalogId((String) li.get("service_catalog_id"));
                itemRepo.save(item);
            }
        }
        Map<String, Object> m = toMap(inv);
        invoiceFeaturesRepo.findByInvoiceId(inv.getId()).ifPresent(f -> addPredictionToMap(m, f));
        patientRepo.findById(inv.getPatientId()).ifPresent(p -> m.put("patients", Map.of("full_name", p.getFullName(), "user_id", p.getUserId())));
        return ResponseEntity.ok(m);
    }

    @PostMapping("/from-recommendations")
    public ResponseEntity<Map<String, Object>> fromRecommendations(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        @SuppressWarnings("unchecked")
        List<String> recommendationIds = (List<String>) body.get("recommendation_ids");
        String patientId = (String) body.get("patient_id");
        String hospitalId = (String) body.get("hospital_id");
        if (recommendationIds == null || recommendationIds.isEmpty())
            throw new RuntimeException("recommendation_ids required");
        BigDecimal total = BigDecimal.ZERO;
        List<Map<String, Object>> lineItems = new ArrayList<>();
        for (String rid : recommendationIds) {
            DoctorRecommendation rec = recRepo.findById(rid).orElse(null);
            if (rec == null || !"PENDING".equals(rec.getStatus())) continue;
            if (patientId == null) patientId = rec.getPatientId();
            if (hospitalId == null) hospitalId = rec.getHospitalId();
            BigDecimal amt = rec.getRecommendedPrice();
            if (amt == null) {
                amt = catalogRepo.findById(rec.getServiceCatalogId()).map(ServiceCatalog::getPrice).orElse(null);
            }
            if (amt == null) amt = BigDecimal.ZERO;
            total = total.add(amt);
            String desc = catalogRepo.findById(rec.getServiceCatalogId()).map(ServiceCatalog::getName).orElse("Service");
            Map<String, Object> li = new HashMap<>();
            li.put("description", desc);
            li.put("amount", amt);
            li.put("item_type", "RECOMMENDED");
            li.put("recommendation_id", rid);
            li.put("service_catalog_id", rec.getServiceCatalogId());
            lineItems.add(li);
        }
        if (patientId == null || total.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("No valid recommendations or patient_id required");
        Invoice inv = new Invoice();
        inv.setPatientId(patientId);
        inv.setHospitalId(hospitalId);
        inv.setTotalAmount(total);
        inv.setPaymentStatus("UNPAID");
        inv.setDueDate(LocalDate.now().plusDays(30));
        populateFromPatientIfMissing(inv);
        inv = invoiceRepo.save(inv);
        runMlAndSaveFeatures(inv);
        final String invoiceId = inv.getId();
        for (Map<String, Object> li : lineItems) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoiceId(invoiceId);
            item.setDescription((String) li.get("description"));
            item.setAmount(new BigDecimal(li.get("amount").toString()));
            item.setItemType((String) li.get("item_type"));
            item.setRecommendationId((String) li.get("recommendation_id"));
            item.setServiceCatalogId((String) li.get("service_catalog_id"));
            itemRepo.save(item);
            recRepo.findById((String) li.get("recommendation_id")).ifPresent(r -> {
                r.setStatus("INVOICED");
                r.setInvoiceId(invoiceId);
                recRepo.save(r);
            });
        }
        Map<String, Object> m = toMap(inv);
        invoiceFeaturesRepo.findByInvoiceId(inv.getId()).ifPresent(f -> addPredictionToMap(m, f));
        patientRepo.findById(inv.getPatientId()).ifPresent(p -> m.put("patients", Map.of("full_name", p.getFullName(), "user_id", p.getUserId())));
        return ResponseEntity.ok(m);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<Map<String, Object>> receipt(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return invoiceRepo.findById(id).map(inv -> {
            Map<String, Object> m = new HashMap<>();
            m.put("invoice", toMap(inv));
            patientRepo.findById(inv.getPatientId()).ifPresent(p -> {
                m.put("patient_name", p.getFullName());
                m.put("patient_id", p.getId());
            });
            List<InvoiceItem> items = itemRepo.findByInvoiceIdOrderByCreatedAtAsc(id);
            List<Map<String, Object>> itemList = new ArrayList<>();
            for (InvoiceItem it : items) {
                Map<String, Object> im = new HashMap<>();
                im.put("description", it.getDescription());
                im.put("amount", it.getAmount());
                im.put("item_type", it.getItemType());
                itemList.add(im);
            }
            m.put("items", itemList);
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    private void applyInvoiceExtras(Invoice inv, Map<String, Object> body) {
        if (body.get("days_to_payment") != null) inv.setDaysToPayment(intFrom(body.get("days_to_payment")));
        if (body.get("payment_delay_flag") != null) inv.setPaymentDelayFlag(Boolean.TRUE.equals(body.get("payment_delay_flag")));
        if (body.get("payer_type") != null) inv.setPayerType((String) body.get("payer_type"));
        if (body.get("invoice_category") != null) inv.setInvoiceCategory((String) body.get("invoice_category"));
        if (body.get("reminder_count") != null) inv.setReminderCount(intFrom(body.get("reminder_count")));
        if (body.get("installment_plan") != null) inv.setInstallmentPlan(Boolean.TRUE.equals(body.get("installment_plan")));
        if (body.get("historical_avg_payment_delay") != null) inv.setHistoricalAvgPaymentDelay(intFrom(body.get("historical_avg_payment_delay")));
        if (body.get("patient_age") != null) inv.setPatientAge(intFrom(body.get("patient_age")));
        if (body.get("patient_gender") != null) inv.setPatientGender((String) body.get("patient_gender"));
        if (body.get("previous_late_payments") != null) inv.setPreviousLatePayments(intFrom(body.get("previous_late_payments")));
    }

    private static Integer intFrom(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        return Integer.parseInt(o.toString());
    }

    private Map<String, Object> toMap(Invoice i) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", i.getId());
        m.put("invoice_number", i.getInvoiceNumber());
        m.put("patient_id", i.getPatientId());
        m.put("claim_id", i.getClaimId());
        m.put("total_amount", i.getTotalAmount());
        m.put("due_date", i.getDueDate());
        m.put("payment_status", i.getPaymentStatus());
        m.put("hospital_id", i.getHospitalId());
        m.put("days_to_payment", i.getDaysToPayment());
        m.put("payment_delay_flag", i.getPaymentDelayFlag());
        m.put("payer_type", i.getPayerType());
        m.put("invoice_category", i.getInvoiceCategory());
        m.put("reminder_count", i.getReminderCount());
        m.put("installment_plan", i.getInstallmentPlan());
        m.put("historical_avg_payment_delay", i.getHistoricalAvgPaymentDelay());
        m.put("patient_age", i.getPatientAge());
        m.put("patient_gender", i.getPatientGender());
        m.put("previous_late_payments", i.getPreviousLatePayments());
        m.put("created_at", i.getCreatedAt());
        return m;
    }
}
