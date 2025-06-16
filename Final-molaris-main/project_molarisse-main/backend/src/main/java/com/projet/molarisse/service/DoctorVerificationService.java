package com.projet.molarisse.service;

import com.projet.molarisse.dto.DoctorVerificationRequest;
import com.projet.molarisse.user.DoctorVerification;
import com.projet.molarisse.user.DoctorVerificationRepository;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import com.projet.molarisse.notifications.NotificationService;
import com.projet.molarisse.notification.NotificationType;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DoctorVerificationService {

    private final DoctorVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final RoleRepository roleRepository;
    
    private static final Logger log = LoggerFactory.getLogger(DoctorVerificationService.class);
    
    private static final String CABINET_PHOTOS_DIR = "cabinet_photos";
    private static final String DIPLOMA_DOCS_DIR = "diploma_docs";

    public DoctorVerification getVerificationByDoctorId(Integer doctorId) {
        return verificationRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Verification not found for doctor with ID: " + doctorId));
    }

    public List<DoctorVerification> getPendingVerifications() {
        return verificationRepository.findByStatus(DoctorVerification.VerificationStatus.PENDING);
    }

    public List<DoctorVerification> getApprovedVerifications() {
        return verificationRepository.findByStatus(DoctorVerification.VerificationStatus.APPROVED);
    }

    @Transactional
    public DoctorVerification submitVerification(DoctorVerificationRequest request, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        log.info("Processing verification submission for doctor: {} (ID: {})", user.getEmail(), user.getId());
        
        // Ensure the user is a doctor by checking their role
        if (user.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DOCTOR") || a.getAuthority().equals("DOCTOR"))) {
            log.warn("User {} is not a doctor, cannot submit verification", user.getEmail());
            throw new IllegalStateException("Only doctors can submit verification requests");
        }
        
        // Check if a verification already exists for this doctor
        Optional<DoctorVerification> existingVerification = verificationRepository.findByDoctorId(user.getId());
        
        DoctorVerification verification;
        if (existingVerification.isPresent()) {
            // Update existing verification if it's not already approved
            verification = existingVerification.get();
            log.info("Found existing verification with ID: {} for doctor ID: {}, status: {}", 
                    verification.getId(), user.getId(), verification.getStatus());
                    
            if (verification.getStatus() == DoctorVerification.VerificationStatus.APPROVED) {
                log.warn("Doctor ID: {} already has an approved verification", user.getId());
                throw new IllegalStateException("Your verification is already approved");
            }
        } else {
            // Create new verification
            verification = new DoctorVerification();
            verification.setDoctorId(user.getId());
            verification.setStatus(DoctorVerification.VerificationStatus.PENDING);
            log.info("Creating new verification for doctor ID: {}", user.getId());
        }
        
        // Update verification details
        verification.setAddress(request.getAddress());
        verification.setCabinetAddress(request.getCabinetAddress());
        verification.setYearsOfExperience(request.getYearsOfExperience());
        verification.setSpecialties(request.getSpecialties());
        verification.setPostalCode(request.getPostalCode());
        verification.setCabinetName(request.getCabinetName());
        verification.setEmail(request.getEmail());
        verification.setPhoneNumber(request.getPhoneNumber());
        verification.setMessage(request.getMessage());
        
        // Save verification
        DoctorVerification savedVerification = verificationRepository.save(verification);
        log.info("Saved verification with ID: {} for doctor ID: {}", savedVerification.getId(), user.getId());
        
        // Notify admins about the verification request
        notifyAdminsAboutVerificationRequest(user, savedVerification);
        
        return savedVerification;
    }
    
    /**
     * Send notification to all admin users about a new doctor verification request
     */
    private void notifyAdminsAboutVerificationRequest(User doctor, DoctorVerification verification) {
        try {
            log.info("Attempting to notify admins about verification request from doctor ID: {}", doctor.getId());
            
            // Find admin role - try both lowercase and uppercase versions
            Role adminRole = null;
            try {
                adminRole = roleRepository.findByNom("admin")
                        .orElse(null);
                
                if (adminRole == null) {
                    adminRole = roleRepository.findByNom("ADMIN")
                            .orElseThrow(() -> new IllegalStateException("Admin role not found"));
                }
                
                log.info("Found admin role with ID: {}, name: {}", adminRole.getId(), adminRole.getNom());
            } catch (Exception e) {
                log.error("Error finding admin role", e);
                return;
            }
            
            // Find all enabled admin users
            List<User> adminUsers = userRepository.findByRoleAndEnabledTrue(adminRole);
            log.info("Found {} admin users to notify", adminUsers.size());
            
            if (adminUsers.isEmpty()) {
                log.warn("No admin users found to notify about doctor verification request");
                return;
            }
            
            // Create message for notification
            String message = String.format(
                "Nouvelle demande de vérification du Dr. %s %s (%s)",
                doctor.getPrenom(),
                doctor.getNom(),
                doctor.getEmail()
            );
            
            // Send notification to each admin
            for (User admin : adminUsers) {
                try {
                    notificationService.createNotification(
                        admin,
                        message,
                        NotificationType.DOCTOR_VERIFICATION,
                        "/admin/doctor-verifications"
                    );
                    log.info("Notification sent to admin {} (ID: {}) about doctor verification request", 
                            admin.getEmail(), admin.getId());
                } catch (Exception e) {
                    log.error("Error sending notification to admin ID: {}", admin.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error sending notification to admins about doctor verification request", e);
        }
    }

    @Transactional
    public DoctorVerification uploadCabinetPhoto(Integer verificationId, MultipartFile file) {
        DoctorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Verification not found with ID: " + verificationId));
        
        // Supprimer l'ancienne photo si elle existe
        if (verification.getCabinetPhotoPath() != null) {
            fileStorageService.deleteFile(verification.getCabinetPhotoPath());
        }
        
        // Stocker la nouvelle photo dans le sous-répertoire des photos de cabinet
        String fileName = fileStorageService.storeFile(file, CABINET_PHOTOS_DIR);
        verification.setCabinetPhotoPath(fileName);
        
        return verificationRepository.save(verification);
    }

    @Transactional
    public DoctorVerification uploadDiplomaPhoto(Integer verificationId, MultipartFile file) {
        DoctorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Verification not found with ID: " + verificationId));
        
        // Supprimer l'ancien document de diplôme s'il existe
        if (verification.getDiplomaPhotoPath() != null) {
            fileStorageService.deleteFile(verification.getDiplomaPhotoPath());
        }
        
        // Stocker le nouveau document de diplôme (image ou PDF) dans le sous-répertoire des diplômes
        String fileName = fileStorageService.storeFile(file, DIPLOMA_DOCS_DIR);
        verification.setDiplomaPhotoPath(fileName);
        
        return verificationRepository.save(verification);
    }

    @Transactional
    public DoctorVerification updateVerificationStatus(Integer verificationId, DoctorVerification.VerificationStatus status, String message) {
        DoctorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Verification not found with ID: " + verificationId));
        
        verification.setStatus(status);
        if (message != null && !message.isEmpty()) {
            verification.setMessage(message);
        }
        
        // Update doctor's verification status in user table if needed
        if (status == DoctorVerification.VerificationStatus.APPROVED) {
            User doctor = userRepository.findById(verification.getDoctorId())
                    .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + verification.getDoctorId()));
            
            // Update doctor status (you might need to add this field to User entity)
            // doctor.setVerified(true);
            // userRepository.save(doctor);
        }
        
        return verificationRepository.save(verification);
    }

    public List<DoctorVerification> getAllVerifications() {
        return verificationRepository.findAll();
    }
} 