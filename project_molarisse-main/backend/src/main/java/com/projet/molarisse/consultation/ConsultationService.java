package com.projet.molarisse.consultation;

import com.projet.molarisse.patient.FichePatient;
import com.projet.molarisse.patient.FichePatientRepository;
import com.projet.molarisse.bilan.BilanMedical;
import com.projet.molarisse.bilan.BilanMedicalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ConsultationService {
    @Autowired
    private ConsultationRepository consultationRepository;
    @Autowired
    private FichePatientRepository fichePatientRepository;
    @Autowired
    private BilanMedicalService bilanMedicalService;

    public Consultation saveConsultation(Integer fichePatientId, BilanMedical bilanMedical, String historique) {
        FichePatient fichePatient = fichePatientRepository.findById(fichePatientId)
                .orElseThrow(() -> new RuntimeException("Fiche patient not found"));
        BilanMedical savedBilan = bilanMedicalService.saveBilan(bilanMedical);
        Consultation consultation = Consultation.builder()
                .fichePatient(fichePatient)
                .bilanMedical(savedBilan)
                .historique(historique)
                .build();
        return consultationRepository.save(consultation);
    }

    public List<Consultation> getConsultationsByFichePatient(Integer fichePatientId) {
        return consultationRepository.findByFichePatientIdOrderByDateDesc(fichePatientId);
    }

    public Optional<Consultation> getConsultation(Integer id) {
        return consultationRepository.findById(id);
    }

    public Consultation updateConsultation(Integer id, BilanMedical bilanMedical, String historique) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        BilanMedical savedBilan = bilanMedicalService.saveBilan(bilanMedical);
        consultation.setBilanMedical(savedBilan);
        consultation.setHistorique(historique);
        return consultationRepository.save(consultation);
    }
} 