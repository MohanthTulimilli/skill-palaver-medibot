package com.medibots.repository;

import com.medibots.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, String> {
    List<Claim> findAllByOrderByCreatedAtDesc();
    List<Claim> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<Claim> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
}
