package com.medibots.repository;

import com.medibots.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findAllByOrderByAppointmentDateDesc();
    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(String doctorId);
    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(String patientId);
    List<Appointment> findByHospitalIdOrderByAppointmentDateDesc(String hospitalId);
    List<Appointment> findByStatusOrderByAppointmentDateDesc(String status);
}
