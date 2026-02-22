package com.medibots.repository;

import com.medibots.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, String> {
    Optional<Patient> findByUserId(String userId);
    List<Patient> findAllByOrderByCreatedAtDesc();
    List<Patient> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
    List<Patient> findByHospitalIdAndOnboardingStatusOrderByCreatedAtDesc(String hospitalId, String onboardingStatus);
}
