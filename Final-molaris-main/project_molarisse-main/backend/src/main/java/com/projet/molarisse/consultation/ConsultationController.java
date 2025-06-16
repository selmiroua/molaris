package com.projet.molarisse.consultation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import com.projet.molarisse.bilan.BilanMedical;
import com.projet.molarisse.bilan.BilanMedicalRepository;
import com.projet.molarisse.appointment.Appointment;
import com.projet.molarisse.appointment.AppointmentRepository;
import com.projet.molarisse.patient.FichePatient;
import com.projet.molarisse.patient.FichePatientRepository;
import lombok.Data;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {
    @Autowired
    private ConsultationService consultationService;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private BilanMedicalRepository bilanMedicalRepository;
    
    @Autowired
    private FichePatientRepository fichePatientRepository;

    @PostMapping
    public ResponseEntity<Consultation> createConsultation(@RequestBody ConsultationRequest request) {
        try {
            System.out.println("ConsultationController: Creating consultation from request: " + request);
            
            Consultation consultation;
            
            // If appointmentId is provided, create consultation from appointment
            if (request.getAppointmentId() != null) {
                consultation = createConsultationFromAppointment(request.getAppointmentId(), request.getBilanMedicalId());
            } else {
                // Traditional way of creating consultation
                consultation = consultationService.saveConsultation(
                        request.getFichePatientId(),
                        request.getBilanMedical(),
                        request.getHistorique()
                );
            }
            
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            System.err.println("ConsultationController: Error creating consultation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    private Consultation createConsultationFromAppointment(Integer appointmentId, Integer bilanMedicalId) {
        System.out.println("Creating consultation from appointment ID: " + appointmentId + ", bilanMedicalId: " + bilanMedicalId);
        
        if (appointmentId == null) {
            System.err.println("Appointment ID cannot be null");
            throw new IllegalArgumentException("Appointment ID cannot be null");
        }
        
        try {
            // Get the appointment
            System.out.println("Fetching appointment with ID: " + appointmentId);
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));
            System.out.println("Found appointment: " + appointment);
            
            // Get or create FichePatient for the patient first
            if (appointment.getPatient() == null) {
                System.err.println("Patient is null in appointment: " + appointmentId);
                throw new IllegalArgumentException("Patient information is missing in the appointment");
            }
            
            if (appointment.getPatient().getId() == null) {
                System.err.println("Patient ID is null in appointment: " + appointmentId);
                throw new IllegalArgumentException("Patient ID is missing in the appointment");
            }
            
            System.out.println("Fetching FichePatient for patient ID: " + appointment.getPatient().getId());
            FichePatient fichePatient = fichePatientRepository.findByPatientId(appointment.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("FichePatient not found for patient ID: " + appointment.getPatient().getId()));
            System.out.println("Found FichePatient: " + fichePatient);
            
            // Get or create BilanMedical
            BilanMedical bilanMedical;
            if (bilanMedicalId != null && bilanMedicalId > 0) {
                System.out.println("Fetching existing BilanMedical with ID: " + bilanMedicalId);
                bilanMedical = bilanMedicalRepository.findById(bilanMedicalId)
                        .orElseThrow(() -> new RuntimeException("BilanMedical not found with ID: " + bilanMedicalId));
                System.out.println("Found BilanMedical: " + bilanMedical);
                
                // Ensure the BilanMedical has a FichePatient set
                if (bilanMedical.getFichePatient() == null) {
                    System.out.println("Existing BilanMedical has no FichePatient, setting it now");
                    bilanMedical.setFichePatient(fichePatient);
                    bilanMedical = bilanMedicalRepository.save(bilanMedical);
                    System.out.println("Updated BilanMedical with FichePatient ID: " + fichePatient.getId());
                }
            } else {
                System.out.println("Creating new BilanMedical with FichePatient ID: " + fichePatient.getId());
                // Use Builder pattern to ensure all required fields are set
                bilanMedical = BilanMedical.builder()
                    .fichePatient(fichePatient)
                    .build();
                
                System.out.println("Saving new BilanMedical with FichePatient ID: " + fichePatient.getId());
                try {
                    bilanMedical = bilanMedicalRepository.save(bilanMedical);
                    System.out.println("Saved new BilanMedical with ID: " + bilanMedical.getId());
                } catch (Exception e) {
                    System.err.println("Error saving BilanMedical: " + e.getMessage());
                    throw new RuntimeException("Failed to save BilanMedical: " + e.getMessage(), e);
                }
            }
        
            // Create and save the consultation
            System.out.println("Creating consultation with FichePatient ID: " + fichePatient.getId() + 
                             " and BilanMedical ID: " + bilanMedical.getId());
            Consultation consultation = Consultation.builder()
                    .fichePatient(fichePatient)
                    .bilanMedical(bilanMedical)
                    .date(appointment.getAppointmentDateTime())
                    .build();
            
            System.out.println("Saving consultation");
            Consultation savedConsultation = consultationService.saveConsultation(consultation);
            System.out.println("Saved consultation with ID: " + savedConsultation.getId());
            
            return savedConsultation;
        } catch (Exception e) {
            System.err.println("ConsultationController: Error creating consultation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<Consultation> updateConsultation(@PathVariable Integer id, @RequestBody ConsultationRequest request) {
        Consultation consultation = consultationService.updateConsultation(
                id,
                request.getBilanMedical(),
                request.getHistorique()
        );
        return ResponseEntity.ok(consultation);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConsultation(@PathVariable Integer id) {
        try {
            System.out.println("ConsultationController: Getting consultation with ID: " + id);
            
            Optional<Consultation> consultation = consultationService.getConsultation(id);
            if (consultation.isPresent()) {
                return ResponseEntity.ok(consultation.get());
            } else {
                System.out.println("ConsultationController: Consultation not found with ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Consultation not found with ID: " + id);
            }
        } catch (Exception e) {
            System.err.println("ConsultationController: Error getting consultation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error getting consultation: " + e.getMessage());
        }
    }
    
    @GetMapping("/fiche/{fichePatientId}")
    public ResponseEntity<List<Consultation>> getConsultationsByFichePatient(@PathVariable Integer fichePatientId) {
        List<Consultation> consultations = consultationService.getConsultationsByFichePatient(fichePatientId);
        return ResponseEntity.ok(consultations);
    }
    
    @PostMapping("/{id}/payment")
    public ResponseEntity<Consultation> updateConsultationPayment(@PathVariable Integer id, @RequestBody PaymentRequest paymentRequest) {
        System.out.println("ConsultationController: Received payment request for consultation ID: " + id);
        System.out.println("ConsultationController: Payment data received: " + paymentRequest);
        
        try {
            Consultation consultation = consultationService.updateConsultationPayment(
                    id,
                    paymentRequest.getAmountToPay(),
                    paymentRequest.getAmountPaid(),
                    paymentRequest.getPaymentMethod(),
                    paymentRequest.getPaymentNotes(),
                    paymentRequest.getProfit(),
                    paymentRequest.getRemainingToPay()
            );
            System.out.println("ConsultationController: Payment updated successfully for consultation ID: " + id);
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            System.err.println("ConsultationController: Error updating payment for consultation ID: " + id);
            System.err.println("ConsultationController: Error details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
}

class ConsultationRequest {
    private Integer fichePatientId;
    private BilanMedical bilanMedical;
    private String historique;
    private Integer appointmentId;
    private Integer bilanMedicalId;

    public Integer getFichePatientId() { return fichePatientId; }
    public void setFichePatientId(Integer fichePatientId) { this.fichePatientId = fichePatientId; }
    public BilanMedical getBilanMedical() { return bilanMedical; }
    public void setBilanMedical(BilanMedical bilanMedical) { this.bilanMedical = bilanMedical; }
    public String getHistorique() { return historique; }
    public void setHistorique(String historique) { this.historique = historique; }
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }
    public Integer getBilanMedicalId() { return bilanMedicalId; }
    public void setBilanMedicalId(Integer bilanMedicalId) { this.bilanMedicalId = bilanMedicalId; }
    
    @Override
    public String toString() {
        return "ConsultationRequest{" +
                "fichePatientId=" + fichePatientId +
                ", bilanMedical=" + bilanMedical +
                ", historique='" + historique + '\'' +
                ", appointmentId=" + appointmentId +
                ", bilanMedicalId=" + bilanMedicalId +
                '}';
    }
}

@Data
class PaymentRequest {
    private Double amountToPay;
    private Double amountPaid;
    private String paymentMethod;
    private String paymentNotes;
    private Double profit;
    private Double remainingToPay;
} 