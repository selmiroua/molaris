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
    
    public Consultation saveConsultation(Consultation consultation) {
        System.out.println("ConsultationService: Saving consultation directly: " + consultation);
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
    
    public Consultation updateConsultationPayment(Integer id, Double amountToPay, Double amountPaid, 
                                               String paymentMethod, String paymentNotes, 
                                               Double profit, Double remainingToPay) {
        System.out.println("ConsultationService: Updating payment for consultation ID: " + id);
        System.out.println("ConsultationService: Payment details - amountToPay: " + amountToPay + 
                         ", amountPaid: " + amountPaid + ", paymentMethod: " + paymentMethod);
        
        try {
            Consultation consultation = consultationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Consultation not found"));
            
            System.out.println("ConsultationService: Found consultation with ID: " + id);
            
            consultation.setAmountToPay(amountToPay);
            consultation.setAmountPaid(amountPaid);
            consultation.setPaymentMethod(paymentMethod);
            consultation.setPaymentNotes(paymentNotes);
            consultation.setProfit(profit);
            consultation.setRemainingToPay(remainingToPay);
            
            System.out.println("ConsultationService: Updated consultation payment fields, saving to database");
            Consultation savedConsultation = consultationRepository.save(consultation);
            System.out.println("ConsultationService: Successfully saved consultation with payment data");
            
            return savedConsultation;
        } catch (Exception e) {
            System.err.println("ConsultationService: Error updating payment for consultation ID: " + id);
            System.err.println("ConsultationService: Error details: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}