package com.projet.molarisse.ordonnance;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.projet.molarisse.user.UserRepository;
import com.projet.molarisse.user.User;

@RestController
@RequestMapping("/api/ordonnances")
public class OrdonnanceController {
    @Autowired
    private OrdonnanceService ordonnanceService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<Ordonnance> create(@RequestBody OrdonnanceDTO dto) {
        Ordonnance ordonnance = new Ordonnance();
        ordonnance.setTreatments(dto.getTreatments());
        ordonnance.setPatientName(dto.getPatientName());
        ordonnance.setSignature(dto.getSignature());
            ordonnance.setDate(java.time.LocalDateTime.now());
        ordonnance.setToothNumber(dto.getToothNumber());

        if (dto.getDoctorId() != null) {
            ordonnance.setDoctor(userRepository.findById(dto.getDoctorId().intValue()).orElse(null));
        }
        if (dto.getPatientId() != null) {
            ordonnance.setPatient(userRepository.findById(dto.getPatientId().intValue()).orElse(null));
        }

        return ResponseEntity.ok(ordonnanceService.save(ordonnance));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<Ordonnance> update(@PathVariable Long id, @RequestBody OrdonnanceDTO dto) {
        Ordonnance existingOrdonnance = ordonnanceService.findById(id)
            .orElseThrow(() -> new RuntimeException("Ordonnance not found with id: " + id));
            
        // For updates, directly replace the treatments
        if (dto.getTreatments() != null) {
            existingOrdonnance.setTreatments(dto.getTreatments());
        }
        
        // Update other ordonnance properties
        existingOrdonnance.setPatientName(dto.getPatientName());
        existingOrdonnance.setSignature(dto.getSignature());
        existingOrdonnance.setToothNumber(dto.getToothNumber());

        if (dto.getDoctorId() != null) {
            existingOrdonnance.setDoctor(userRepository.findById(dto.getDoctorId().intValue()).orElse(null));
        }
        if (dto.getPatientId() != null) {
            existingOrdonnance.setPatient(userRepository.findById(dto.getPatientId().intValue()).orElse(null));
        }

        // Log the update operation
        System.out.println("Updating ordonnance with ID: " + id);
        System.out.println("New treatments: " + dto.getTreatments());

        return ResponseEntity.ok(ordonnanceService.save(existingOrdonnance));
    }

    @GetMapping
    public ResponseEntity<List<Ordonnance>> getAll() {
        return ResponseEntity.ok(ordonnanceService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE', 'PATIENT')")
    public ResponseEntity<Ordonnance> getById(@PathVariable Long id) {
        return ordonnanceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ordonnanceService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE', 'PATIENT')")
    public ResponseEntity<List<Ordonnance>> getByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(ordonnanceService.findByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<List<Ordonnance>> getByDoctorId(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ordonnanceService.findByDoctorId(doctorId));
    }

    @GetMapping("/exists")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE', 'PATIENT')")
    public ResponseEntity<Boolean> existsForTooth(
            @RequestParam Long patientId,
            @RequestParam Integer toothNumber) {
        return ResponseEntity.ok(ordonnanceService.existsForTooth(patientId, toothNumber));
    }

    @GetMapping("/by-patient-tooth")
    @PreAuthorize("hasAnyRole('DOCTOR', 'SECRETAIRE', 'PATIENT')")
    public ResponseEntity<List<Ordonnance>> getByPatientIdAndToothNumber(
        @RequestParam Long patientId,
            @RequestParam Integer toothNumber) {
        return ResponseEntity.ok(ordonnanceService.findByPatientIdAndToothNumber(patientId, toothNumber));
    }
} 