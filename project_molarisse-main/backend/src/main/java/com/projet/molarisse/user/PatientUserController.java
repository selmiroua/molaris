package com.projet.molarisse.user;

import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class PatientUserController {
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    /**
     * Récupère la liste de tous les patients
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPatients() {
        try {
            Role patientRole = roleRepository.findByNom("patient")
                .orElseThrow(() -> new EntityNotFoundException("Patient role not found"));
                
            List<User> patients = userRepository.findByRole(patientRole);
            
            List<Map<String, Object>> patientsList = patients.stream()
                .map(patient -> {
                    Map<String, Object> patientMap = new HashMap<>();
                    patientMap.put("id", patient.getId());
                    patientMap.put("nom", patient.getNom());
                    patientMap.put("prenom", patient.getPrenom());
                    patientMap.put("email", patient.getEmail());
                    patientMap.put("phoneNumber", patient.getPhoneNumber());
                    patientMap.put("role", Map.of("id", 4, "nom", "patient"));
                    return patientMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(patientsList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère un patient par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getPatientById(@PathVariable Integer id) {
        try {
            Role patientRole = roleRepository.findByNom("patient")
                .orElseThrow(() -> new EntityNotFoundException("Patient role not found"));
                
            User patient = userRepository.findByIdAndRole(id, patientRole)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + id));
                
            return ResponseEntity.ok(patient);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 