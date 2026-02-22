package com.medibots.repository;

import com.medibots.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OperationRepository extends JpaRepository<Operation, String> {
    List<Operation> findByHospitalIdOrderByScheduledAtDesc(String hospitalId);
    List<Operation> findByPatientIdOrderByScheduledAtDesc(String patientId);
    List<Operation> findByDoctorIdOrderByScheduledAtDesc(String doctorId);
    List<Operation> findByOperationTheatreIdOrderByScheduledAtDesc(String operationTheatreId);
}
