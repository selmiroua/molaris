package com.projet.molarisse.consultation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import com.projet.molarisse.bilan.BilanMedical;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {
    @Autowired
    private ConsultationService consultationService;

    @PostMapping
    public ResponseEntity<Consultation> createConsultation(@RequestBody ConsultationRequest request) {
        Consultation consultation = consultationService.saveConsultation(
                request.getFichePatientId(),
                request.getBilanMedical(),
                request.getHistorique()
        );
        return ResponseEntity.ok(consultation);
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

    @GetMapping("/fiche/{fichePatientId}")
    public ResponseEntity<List<Consultation>> getConsultationsByFichePatient(@PathVariable Integer fichePatientId) {
        return ResponseEntity.ok(consultationService.getConsultationsByFichePatient(fichePatientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Consultation> getConsultation(@PathVariable Integer id) {
        Optional<Consultation> consultation = consultationService.getConsultation(id);
        return consultation.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

class ConsultationRequest {
    private Integer fichePatientId;
    private BilanMedical bilanMedical;
    private String historique;

    public Integer getFichePatientId() { return fichePatientId; }
    public void setFichePatientId(Integer fichePatientId) { this.fichePatientId = fichePatientId; }
    public BilanMedical getBilanMedical() { return bilanMedical; }
    public void setBilanMedical(BilanMedical bilanMedical) { this.bilanMedical = bilanMedical; }
    public String getHistorique() { return historique; }
    public void setHistorique(String historique) { this.historique = historique; }
} 