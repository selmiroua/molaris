package com.projet.molarisse.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppointmentDocumentRepository extends JpaRepository<AppointmentDocument, Integer> {
    List<AppointmentDocument> findByAppointmentId(Integer appointmentId);
} 