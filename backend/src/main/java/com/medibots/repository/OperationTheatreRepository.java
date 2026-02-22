package com.medibots.repository;

import com.medibots.entity.OperationTheatre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OperationTheatreRepository extends JpaRepository<OperationTheatre, String> {
    List<OperationTheatre> findByHospitalIdAndStatusOrderByName(String hospitalId, String status);
    List<OperationTheatre> findByHospitalIdOrderByName(String hospitalId);
}
