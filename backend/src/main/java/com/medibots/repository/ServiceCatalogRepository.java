package com.medibots.repository;

import com.medibots.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, String> {
    List<ServiceCatalog> findByHospitalIdAndStatusOrderByName(String hospitalId, String status);
    List<ServiceCatalog> findByHospitalIdOrderByName(String hospitalId);
    List<ServiceCatalog> findByHospitalIdAndServiceTypeOrderByName(String hospitalId, String serviceType);
}
