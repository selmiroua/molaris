package com.projet.molarisse.ordonnance;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrdonnanceService {
    @Autowired
    private OrdonnanceRepository ordonnanceRepository;

    public Ordonnance save(Ordonnance ordonnance) {
        return ordonnanceRepository.save(ordonnance);
    }

    public List<Ordonnance> findAll() {
        return ordonnanceRepository.findAll();
    }

    public Optional<Ordonnance> findById(Long id) {
        return ordonnanceRepository.findById(id);
    }

    public void deleteById(Long id) {
        ordonnanceRepository.deleteById(id);
    }

    public List<Ordonnance> findByPatientId(Long patientId) {
        return ordonnanceRepository.findByPatient_Id(patientId);
    }

    public List<Ordonnance> findByDoctorId(Long doctorId) {
        return ordonnanceRepository.findByDoctor_Id(doctorId);
    }

    public List<Ordonnance> findByPatientIdAndToothNumber(Long patientId, Integer toothNumber) {
        return ordonnanceRepository.findByPatient_IdAndToothNumber(patientId, toothNumber);
    }

    public boolean existsForTooth(Long patientId, Integer toothNumber) {
        return !ordonnanceRepository.findByPatient_IdAndToothNumber(patientId, toothNumber).isEmpty();
    }
} 