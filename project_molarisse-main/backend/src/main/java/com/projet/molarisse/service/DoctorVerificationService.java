package com.projet.molarisse.service;

import com.projet.molarisse.dto.DoctorVerificationRequest;
import com.projet.molarisse.user.DoctorVerification;
import com.projet.molarisse.user.DoctorVerificationRepository;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import lombok.RequiredArgsConstructor;
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
        
        // Ensure the user is a doctor by checking their role
        if (user.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DOCTOR") || a.getAuthority().equals("DOCTOR"))) {
            throw new IllegalStateException("Only doctors can submit verification requests");
        }
        
        // Check if a verification already exists for this doctor
        Optional<DoctorVerification> existingVerification = verificationRepository.findByDoctorId(user.getId());
        
        DoctorVerification verification;
        if (existingVerification.isPresent()) {
            // Update existing verification if it's not already approved
            verification = existingVerification.get();
            if (verification.getStatus() == DoctorVerification.VerificationStatus.APPROVED) {
                throw new IllegalStateException("Your verification is already approved");
            }
        } else {
            // Create new verification
            verification = new DoctorVerification();
            verification.setDoctorId(user.getId());
            verification.setStatus(DoctorVerification.VerificationStatus.PENDING);
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
        
        return verificationRepository.save(verification);
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