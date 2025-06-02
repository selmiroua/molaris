package com.projet.molarisse.user;

import com.projet.molarisse.appointment.Appointment;
import com.projet.molarisse.appointment.AppointmentRepository;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class DoctorUserController {
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Récupère la liste de tous les médecins activés
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllDoctors() {
        List<User> doctors = userService.getAllEnabledDoctors();
        return ResponseEntity.ok(doctors);
    }

    /**
     * Récupère un médecin par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getDoctorById(@PathVariable Integer id) {
        try {
            User doctor = userService.getDoctorById(id);
            return ResponseEntity.ok(doctor);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Récupère la liste des patients d'un médecin
     */
    @GetMapping("/{doctorId}/patients")
    public ResponseEntity<List<Map<String, Object>>> getDoctorPatients(@PathVariable Integer doctorId) {
        try {
            List<User> patients = userService.getPatientsWithAppointmentsForDoctor(doctorId);
            
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
     * Récupère la liste des secrétaires d'un médecin
     */
    @GetMapping("/{doctorId}/secretaries")
    public ResponseEntity<List<Map<String, Object>>> getDoctorSecretaries(@PathVariable Integer doctorId) {
        try {
            // Vérifier que le médecin existe
            Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
                
            User doctor = userRepository.findByIdAndRole(doctorId, doctorRole)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with id: " + doctorId));
            
            // Récupérer les secrétaires assignées à ce médecin
            List<User> secretaries = userRepository.findByAssignedDoctor(doctor);
            
            List<Map<String, Object>> secretaryList = secretaries.stream()
                .map(secretary -> {
                    Map<String, Object> secretaryMap = new HashMap<>();
                    secretaryMap.put("id", secretary.getId());
                    secretaryMap.put("nom", secretary.getNom());
                    secretaryMap.put("prenom", secretary.getPrenom());
                    secretaryMap.put("email", secretary.getEmail());
                    secretaryMap.put("phoneNumber", secretary.getPhoneNumber());
                    secretaryMap.put("role", Map.of("id", 3, "nom", "secretaire"));
                    return secretaryMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(secretaryList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 