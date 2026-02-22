package com.medibots.repository;

import com.medibots.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findByHospitalIdAndStatusOrderByName(String hospitalId, String status);
    List<Department> findByHospitalIdOrderByName(String hospitalId);
}
