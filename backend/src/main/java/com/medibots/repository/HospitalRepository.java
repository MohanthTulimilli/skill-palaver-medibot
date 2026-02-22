package com.medibots.repository;

import com.medibots.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HospitalRepository extends JpaRepository<Hospital, String> {
    List<Hospital> findByStatusOrderByCreatedAtDesc(String status);
}
