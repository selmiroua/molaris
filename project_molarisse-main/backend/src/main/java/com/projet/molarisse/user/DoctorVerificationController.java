package com.projet.molarisse.user;

import com.projet.molarisse.dto.DentalSpecialties;
import com.projet.molarisse.dto.DoctorVerificationRequest;
import com.projet.molarisse.service.DoctorVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctor-verifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class DoctorVerificationController {

    private final DoctorVerificationService verificationService;

    /**
     * Récupérer la liste des spécialités dentaires disponibles
     */
    @GetMapping("/specialties")
    public ResponseEntity<List<String>> getDentalSpecialties() {
        return ResponseEntity.ok(DentalSpecialties.SPECIALTIES);
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> submitVerification(
            @Valid @RequestBody DoctorVerificationRequest request,
            Authentication authentication) {
        
        // Vérifier si les spécialités soumises sont valides
        if (request.getSpecialties() != null && !request.getSpecialties().isEmpty()) {
            if (!DentalSpecialties.areValidSpecialties(request.getSpecialties())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Certaines spécialités ne sont pas valides. Veuillez choisir uniquement parmi les spécialités dentaires autorisées.");
                error.put("validSpecialties", String.join(", ", DentalSpecialties.SPECIALTIES));
                return ResponseEntity.badRequest().body(error);
            }
        }
        
        DoctorVerification verification = verificationService.submitVerification(request, authentication);
        return ResponseEntity.ok(verification);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<DoctorVerification> getVerificationByDoctorId(@PathVariable Integer doctorId) {
        try {
            DoctorVerification verification = verificationService.getVerificationByDoctorId(doctorId);
            return ResponseEntity.ok(verification);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DoctorVerification>> getPendingVerifications() {
        List<DoctorVerification> pendingVerifications = verificationService.getPendingVerifications();
        return ResponseEntity.ok(pendingVerifications);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<DoctorVerification>> getApprovedVerifications() {
        List<DoctorVerification> approvedVerifications = verificationService.getApprovedVerifications();
        return ResponseEntity.ok(approvedVerifications);
    }

    @PutMapping("/{verificationId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorVerification> updateVerificationStatus(
            @PathVariable Integer verificationId,
            @RequestBody StatusUpdateRequest request) {
        DoctorVerification verification = verificationService.updateVerificationStatus(
                verificationId, 
                DoctorVerification.VerificationStatus.valueOf(request.getStatus().toUpperCase()),
                request.getMessage()
        );
        return ResponseEntity.ok(verification);
    }

    @PostMapping("/{verificationId}/cabinet-photo")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> uploadCabinetPhoto(
            @PathVariable Integer verificationId,
            @RequestParam("file") MultipartFile file) {
        // Pour les photos du cabinet, on accepte uniquement les images
        if (file.isEmpty() || !file.getContentType().startsWith("image/")) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Le fichier doit être une image (JPG, PNG, etc.)");
            return ResponseEntity.badRequest().body(error);
        }
        DoctorVerification verification = verificationService.uploadCabinetPhoto(verificationId, file);
        return ResponseEntity.ok(verification);
    }

    @PostMapping("/{verificationId}/diploma-photo")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> uploadDiplomaPhoto(
            @PathVariable Integer verificationId,
            @RequestParam("file") MultipartFile file) {
        // Pour les diplômes, on accepte les images et les PDF
        if (file.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Le fichier ne peut pas être vide");
            return ResponseEntity.badRequest().body(error);
        }
        
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Le fichier doit être une image (JPG, PNG, etc.) ou un document PDF");
            return ResponseEntity.badRequest().body(error);
        }
        
        DoctorVerification verification = verificationService.uploadDiplomaPhoto(verificationId, file);
        return ResponseEntity.ok(verification);
    }

    @GetMapping("/check-status/{doctorId}")
    public ResponseEntity<?> checkDoctorApprovalStatus(@PathVariable Integer doctorId) {
        try {
            // Get verification by doctorId
            try {
                DoctorVerification verification = verificationService.getVerificationByDoctorId(doctorId);
                boolean isApproved = verification.getStatus() == DoctorVerification.VerificationStatus.APPROVED;
                return ResponseEntity.ok(isApproved);
            } catch (EntityNotFoundException e) {
                // No verification found
                return ResponseEntity.ok(false);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error checking verification status: " + e.getMessage());
        }
    }

    @GetMapping("/statistics/verification-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getVerificationStatusDistribution() {
        System.out.println("Verification status endpoint called");
        
        // Get all verifications
        List<DoctorVerification> allVerifications = verificationService.getAllVerifications();
        System.out.println("Found " + allVerifications.size() + " total verifications");
        
        // Count by status
        long pendingCount = allVerifications.stream()
                .filter(v -> v.getStatus() == DoctorVerification.VerificationStatus.PENDING)
                .count();
        
        long approvedCount = allVerifications.stream()
                .filter(v -> v.getStatus() == DoctorVerification.VerificationStatus.APPROVED)
                .count();
        
        long rejectedCount = allVerifications.stream()
                .filter(v -> v.getStatus() == DoctorVerification.VerificationStatus.REJECTED)
                .count();
        
        System.out.println("Counts - Pending: " + pendingCount + ", Approved: " + approvedCount + ", Rejected: " + rejectedCount);
        
        // Create response format
        List<Map<String, Object>> distribution = new ArrayList<>();
        
        Map<String, Object> pending = new HashMap<>();
        pending.put("name", "En attente");
        pending.put("value", pendingCount);
        distribution.add(pending);
        
        Map<String, Object> approved = new HashMap<>();
        approved.put("name", "Approuvées");
        approved.put("value", approvedCount);
        distribution.add(approved);
        
        Map<String, Object> rejected = new HashMap<>();
        rejected.put("name", "Rejetées");
        rejected.put("value", rejectedCount);
        distribution.add(rejected);
        
        System.out.println("Returning response: " + distribution);
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Doctor verification controller is working");
    }

    // Inner class for status update request
    @lombok.Data
    public static class StatusUpdateRequest {
        private String status;
        private String message;
    }
} 