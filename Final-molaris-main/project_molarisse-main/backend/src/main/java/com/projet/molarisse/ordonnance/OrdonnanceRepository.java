package com.projet.molarisse.ordonnance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    List<Ordonnance> findByPatient_Id(Long patientId);
    List<Ordonnance> findByDoctor_Id(Long doctorId);
    List<Ordonnance> findByPatient_IdAndToothNumber(Long patientId, Integer toothNumber);
} 