package com.projet.molarisse.ordonnance;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<Ordonnance> create(@RequestBody OrdonnanceDTO dto) {
        Ordonnance ordonnance = new Ordonnance();
        ordonnance.setPatientName(dto.getPatientName());
        ordonnance.setTreatments(dto.getTreatments());
        ordonnance.setSignature(dto.getSignature());
        ordonnance.setDate(java.time.LocalDateTime.now());

        if (dto.getDoctorId() != null) {
            ordonnance.setDoctor(userRepository.findById(dto.getDoctorId().intValue()).orElse(null));
        }
        if (dto.getPatientId() != null) {
            ordonnance.setPatient(userRepository.findById(dto.getPatientId().intValue()).orElse(null));
        }

        return ResponseEntity.ok(ordonnanceService.save(ordonnance));
    }
    @GetMapping
    public ResponseEntity<List<Ordonnance>> getAll() {
        return ResponseEntity.ok(ordonnanceService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ordonnance> getById(@PathVariable Long id) {
        return ordonnanceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ordonnanceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
} 