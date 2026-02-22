package com.medibots.repository;

import com.medibots.entity.LabTestBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabTestBookingRepository extends JpaRepository<LabTestBooking, String> {
    List<LabTestBooking> findByPatientIdOrderByScheduledDateDesc(String patientId);
    List<LabTestBooking> findByHospitalIdOrderByScheduledDateDesc(String hospitalId);
}
