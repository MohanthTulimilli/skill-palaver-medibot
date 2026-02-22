package com.medibots.repository;

import com.medibots.entity.AppointmentFeatures;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppointmentFeaturesRepository extends JpaRepository<AppointmentFeatures, String> {
    Optional<AppointmentFeatures> findByAppointmentId(String appointmentId);
}
