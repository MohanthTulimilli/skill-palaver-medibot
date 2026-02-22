package com.medibots.service;

import com.medibots.entity.ServiceCatalog;
import com.medibots.repository.ServiceCatalogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ServiceCatalogSeedService {
    private final ServiceCatalogRepository catalogRepo;

    public ServiceCatalogSeedService(ServiceCatalogRepository catalogRepo) {
        this.catalogRepo = catalogRepo;
    }

    @Transactional
    public int seedForHospital(String hospitalId) {
        List<ServiceCatalog> items = buildCatalog(hospitalId);
        for (ServiceCatalog s : items) catalogRepo.save(s);
        return items.size();
    }

    private List<ServiceCatalog> buildCatalog(String hospitalId) {
        List<ServiceCatalog> out = new ArrayList<>();

        // 1. CONSULTATION
        addService(out, hospitalId, "General Physician Consultation", "CONSULTATION", "OPD", "General", 500);
        addService(out, hospitalId, "Specialist Consultation", "CONSULTATION", "OPD", "Specialist", 800);
        addService(out, hospitalId, "Super Specialist Consultation", "CONSULTATION", "OPD", "Super Specialist", 1200);
        addService(out, hospitalId, "Follow-up Consultation", "CONSULTATION", "OPD", "Follow-up", 300);
        addService(out, hospitalId, "Emergency Consultation", "CONSULTATION", "EMERGENCY", "Emergency", 1500);
        addService(out, hospitalId, "Teleconsultation", "CONSULTATION", "OPD", "Tele", 400);

        // 2. LAB TEST - Blood Tests
        addService(out, hospitalId, "Complete Blood Count - CBC", "LAB_TEST", "BLOOD", "CBC", 350);
        addService(out, hospitalId, "Blood Sugar Fasting", "LAB_TEST", "BLOOD", "Sugar", 150);
        addService(out, hospitalId, "Blood Sugar PP", "LAB_TEST", "BLOOD", "Sugar", 150);
        addService(out, hospitalId, "HbA1c", "LAB_TEST", "BLOOD", "HbA1c", 600);
        addService(out, hospitalId, "Lipid Profile", "LAB_TEST", "BLOOD", "Lipid", 900);
        addService(out, hospitalId, "Liver Function Test - LFT", "LAB_TEST", "BLOOD", "LFT", 800);
        addService(out, hospitalId, "Kidney Function Test - KFT", "LAB_TEST", "BLOOD", "KFT", 750);
        addService(out, hospitalId, "Thyroid Profile - T3 T4 TSH", "LAB_TEST", "BLOOD", "Thyroid", 700);
        addService(out, hospitalId, "Vitamin D", "LAB_TEST", "BLOOD", "Vitamin", 1200);
        addService(out, hospitalId, "Vitamin B12", "LAB_TEST", "BLOOD", "Vitamin", 900);
        addService(out, hospitalId, "C-Reactive Protein - CRP", "LAB_TEST", "BLOOD", "CRP", 600);
        addService(out, hospitalId, "Dengue Test", "LAB_TEST", "BLOOD", "Infection", 1200);
        addService(out, hospitalId, "Malaria Test", "LAB_TEST", "BLOOD", "Infection", 400);
        addService(out, hospitalId, "HIV Test", "LAB_TEST", "BLOOD", "Infection", 500);
        addService(out, hospitalId, "Hepatitis B Surface Antigen", "LAB_TEST", "BLOOD", "Infection", 450);

        // 3. LAB TEST - Urine & Other Tests
        addService(out, hospitalId, "Urine Routine", "LAB_TEST", "URINE", "Routine", 200);
        addService(out, hospitalId, "Urine Culture", "LAB_TEST", "URINE", "Culture", 650);
        addService(out, hospitalId, "Stool Routine", "LAB_TEST", "OTHER", "Stool", 300);
        addService(out, hospitalId, "Blood Culture", "LAB_TEST", "OTHER", "Culture", 1200);

        // 4. DIAGNOSTIC
        addService(out, hospitalId, "ECG", "DIAGNOSTIC", "CARDIAC", "ECG", 300);
        addService(out, hospitalId, "2D Echo", "DIAGNOSTIC", "CARDIAC", "Echo", 2500);
        addService(out, hospitalId, "TMT - Treadmill Test", "DIAGNOSTIC", "CARDIAC", "TMT", 2000);
        addService(out, hospitalId, "Holter Monitoring - 24hr", "DIAGNOSTIC", "CARDIAC", "Holter", 3500);
        addService(out, hospitalId, "Pulmonary Function Test - PFT", "DIAGNOSTIC", "RESPIRATORY", "PFT", 1800);
        addService(out, hospitalId, "EEG", "DIAGNOSTIC", "NEURO", "EEG", 2200);
        addService(out, hospitalId, "Nerve Conduction Study", "DIAGNOSTIC", "NEURO", "NCS", 3000);

        // 5. IMAGING
        addService(out, hospitalId, "Chest X-Ray", "IMAGING", "X_RAY", "Chest", 400);
        addService(out, hospitalId, "Spine X-Ray", "IMAGING", "X_RAY", "Spine", 600);
        addService(out, hospitalId, "Ultrasound Abdomen", "IMAGING", "USG", "Abdomen", 1500);
        addService(out, hospitalId, "Pregnancy Ultrasound", "IMAGING", "USG", "Pregnancy", 1800);
        addService(out, hospitalId, "Doppler Scan", "IMAGING", "USG", "Doppler", 2500);
        addService(out, hospitalId, "CT Brain", "IMAGING", "CT_SCAN", "Brain", 4500);
        addService(out, hospitalId, "CT Abdomen", "IMAGING", "CT_SCAN", "Abdomen", 6000);
        addService(out, hospitalId, "MRI Brain", "IMAGING", "MRI", "Brain", 8000);
        addService(out, hospitalId, "MRI Spine", "IMAGING", "MRI", "Spine", 9500);
        addService(out, hospitalId, "Mammography", "IMAGING", "MAMMOGRAPHY", "Mammography", 3000);

        // 6. SURGERY
        addService(out, hospitalId, "Appendectomy", "SURGERY", "GENERAL", "Appendix", 55000);
        addService(out, hospitalId, "Gallbladder Removal - Laparoscopic", "SURGERY", "GENERAL", "Gallbladder", 75000);
        addService(out, hospitalId, "Hernia Repair", "SURGERY", "GENERAL", "Hernia", 60000);
        addService(out, hospitalId, "Cataract Surgery", "SURGERY", "OPHTHALMOLOGY", "Cataract", 35000);
        addService(out, hospitalId, "Knee Replacement", "SURGERY", "ORTHO", "Knee", 250000);
        addService(out, hospitalId, "Hip Replacement", "SURGERY", "ORTHO", "Hip", 280000);
        addService(out, hospitalId, "C-Section Delivery", "SURGERY", "GYNEC", "C-Section", 90000);
        addService(out, hospitalId, "Angioplasty", "SURGERY", "CARDIAC", "Angioplasty", 180000);
        addService(out, hospitalId, "Bypass Surgery", "SURGERY", "CARDIAC", "Bypass", 350000);

        // 7. MEDICATION - Common Procedures & Therapies (PROCEDURE)
        addService(out, hospitalId, "IV Drip Administration", "PROCEDURE", "THERAPY", "IV", 800);
        addService(out, hospitalId, "Nebulization", "PROCEDURE", "THERAPY", "Nebulization", 400);
        addService(out, hospitalId, "Dialysis Session", "PROCEDURE", "THERAPY", "Dialysis", 2500);
        addService(out, hospitalId, "Chemotherapy Session", "PROCEDURE", "THERAPY", "Chemotherapy", 7000);
        addService(out, hospitalId, "Blood Transfusion", "PROCEDURE", "THERAPY", "Transfusion", 2000);
        addService(out, hospitalId, "Pain Management Injection", "PROCEDURE", "THERAPY", "Injection", 1500);

        // 8. OTHER
        addService(out, hospitalId, "Health Checkup - Basic Package", "OTHER", "CHECKUP", "Basic", 2500);
        addService(out, hospitalId, "Health Checkup - Executive Package", "OTHER", "CHECKUP", "Executive", 7500);
        addService(out, hospitalId, "Medical Fitness Certificate", "OTHER", "ADMIN", "Certificate", 1000);
        addService(out, hospitalId, "Ambulance Service - Local", "OTHER", "ADMIN", "Ambulance", 1500);
        addService(out, hospitalId, "ICU Per Day", "OTHER", "ROOM", "ICU", 10000);
        addService(out, hospitalId, "Room Charges - General Ward (Per Day)", "OTHER", "ROOM", "General", 3000);
        addService(out, hospitalId, "Room Charges - Private Room (Per Day)", "OTHER", "ROOM", "Private", 7000);

        return out;
    }

    private void addService(List<ServiceCatalog> out, String hospitalId, String name, String type, String cat, String sub, double price) {
        ServiceCatalog s = new ServiceCatalog();
        s.setHospitalId(hospitalId);
        s.setName(name);
        s.setServiceType(type);
        s.setCategory(cat);
        s.setSubcategory(sub);
        s.setPrice(BigDecimal.valueOf(price));
        s.setStatus("ACTIVE");
        out.add(s);
    }
}
