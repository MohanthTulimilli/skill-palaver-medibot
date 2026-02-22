package com.medibots.repository;

import com.medibots.entity.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabReportRepository extends JpaRepository<LabReport, String> {
    List<LabReport> findByPatientIdOrderByUploadedAtDesc(String patientId);
    List<LabReport> findByLabTestBookingId(String labTestBookingId);
    List<LabReport> findByHospitalIdOrderByUploadedAtDesc(String hospitalId);
}
