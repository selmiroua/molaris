package com.projet.molarisse.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByPatientId(Integer patientId); // Find appointments by patient ID
    List<Appointment> findByDoctorId(Integer doctorId); // Find appointments by doctor ID
    List<Appointment> findBySecretaryId(Integer secretaryId); // Find appointments by secretary ID
    List<Appointment> findByStatus(Appointment.AppointmentStatus status); // Find appointments by status
    List<Appointment> findByCaseType(CaseType caseType); // Find appointments by case type
List<Appointment> findByAppointmentType(AppointmentType appointmentType); // Find appointments by appointment type
}