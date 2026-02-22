package com.medibots.repository;

import com.medibots.entity.ClaimFeatures;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClaimFeaturesRepository extends JpaRepository<ClaimFeatures, String> {
    Optional<ClaimFeatures> findByClaimId(String claimId);
}
