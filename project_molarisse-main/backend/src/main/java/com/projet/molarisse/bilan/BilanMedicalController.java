package com.projet.molarisse.bilan;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bilans")
public class BilanMedicalController {
    static {
        System.out.println("BilanMedicalController loaded by Spring Boot");
    }
    @Autowired
    private BilanMedicalService bilanMedicalService;

    @PostMapping
    public ResponseEntity<BilanMedical> createBilan(@RequestBody BilanMedical bilan) {
        System.out.println("BilanMedicalController: Received POST /api/bilans");
        return ResponseEntity.ok(bilanMedicalService.saveBilan(bilan));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BilanMedical> updateBilan(@PathVariable Integer id, @RequestBody BilanMedical bilan) {
        bilan.setId(id);
        return ResponseEntity.ok(bilanMedicalService.saveBilan(bilan));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BilanMedical> getBilan(@PathVariable Integer id) {
        Optional<BilanMedical> bilan = bilanMedicalService.getBilan(id);
        return bilan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<BilanMedical>> getAllBilans() {
        return ResponseEntity.ok(bilanMedicalService.getAllBilans());
    }

    @GetMapping("/fichePatient/{fichePatientId}")
    public ResponseEntity<BilanMedical> getBilanByFichePatientId(@PathVariable Integer fichePatientId) {
        System.out.println("BilanMedicalController: Received GET /api/bilans/fichePatient/" + fichePatientId);
        Optional<BilanMedical> bilan = bilanMedicalService.getBilanByFichePatientId(fichePatientId);
        if (bilan.isPresent()) {
            System.out.println("BilanMedicalController: Found BilanMedical for fichePatientId " + fichePatientId);
        } else {
            System.out.println("BilanMedicalController: No BilanMedical found for fichePatientId " + fichePatientId);
        }
        return bilan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBilan(@PathVariable Integer id) {
        bilanMedicalService.deleteBilan(id);
        return ResponseEntity.noContent().build();
    }
} 