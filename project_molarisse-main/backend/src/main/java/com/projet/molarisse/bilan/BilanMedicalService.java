package com.projet.molarisse.bilan;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BilanMedicalService {
    @Autowired
    private BilanMedicalRepository bilanMedicalRepository;

    public BilanMedical saveBilan(BilanMedical bilan) {
        return bilanMedicalRepository.save(bilan);
    }

    public Optional<BilanMedical> getBilan(Integer id) {
        return bilanMedicalRepository.findById(id);
    }

    public List<BilanMedical> getAllBilans() {
        return bilanMedicalRepository.findAll();
    }

    public Optional<BilanMedical> getBilanByFichePatientId(Integer fichePatientId) {
        return bilanMedicalRepository.findByFichePatientId(fichePatientId);
    }

    public void deleteBilan(Integer id) {
        bilanMedicalRepository.deleteById(id);
    }
} 