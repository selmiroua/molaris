package com.projet.molarisse.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DentalInterventionRepository extends JpaRepository<DentalIntervention, Integer> {
    List<DentalIntervention> findByAppointmentId(Integer appointmentId);
} 