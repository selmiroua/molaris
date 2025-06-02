package com.projet.molarisse.admin;

import com.projet.molarisse.user.UserRepository;
import com.projet.molarisse.user.DoctorVerificationRepository;
import com.projet.molarisse.appointment.AppointmentRepository;
import com.projet.molarisse.role.RoleRepository;
import com.projet.molarisse.role.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityNotFoundException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class AdminController {

    private final UserRepository userRepository;
    private final DoctorVerificationRepository verificationRepository;
    private final AppointmentRepository appointmentRepository;
    private final RoleRepository roleRepository;

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Count users by role
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        Role patientRole = roleRepository.findByNom("patient")
                .orElseThrow(() -> new EntityNotFoundException("Patient role not found"));
        
        long totalDoctors = userRepository.countByRole(doctorRole);
        long totalPatients = userRepository.countByRole(patientRole);
        long totalUsers = userRepository.count();
        
        // Count pending verifications
        long pendingVerifications = verificationRepository.countByStatus(
            com.projet.molarisse.user.DoctorVerification.VerificationStatus.PENDING);
        
        // Count total appointments
        long totalAppointments = appointmentRepository.count();
        
        // Add stats to response
        stats.put("totalDoctors", totalDoctors);
        stats.put("totalPatients", totalPatients);
        stats.put("totalUsers", totalUsers);
        stats.put("pendingVerifications", pendingVerifications);
        stats.put("totalAppointments", totalAppointments);
        
        return ResponseEntity.ok(stats);
    }
} 