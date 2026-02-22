package com.medibots.repository;

import com.medibots.entity.DoctorRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorRecommendationRepository extends JpaRepository<DoctorRecommendation, String> {
    List<DoctorRecommendation> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<DoctorRecommendation> findByAppointmentIdOrderByCreatedAtAsc(String appointmentId);
    List<DoctorRecommendation> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
    List<DoctorRecommendation> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
}
