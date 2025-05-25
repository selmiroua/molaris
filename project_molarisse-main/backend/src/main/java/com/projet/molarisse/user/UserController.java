package com.projet.molarisse.user;

import com.projet.molarisse.dto.ProfileUpdateRequest;
import com.projet.molarisse.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.projet.molarisse.dto.SecretaryApplicationRequest;
import com.projet.molarisse.dto.SecretaryActionRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.projet.molarisse.role.RoleRepository;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class UserController {
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    
   

    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest profileUpdateRequest
    ) {
        return ResponseEntity.ok(userService.updateProfile(authentication, profileUpdateRequest));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<User> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/") || file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().build();
        }
        User updatedUser = userService.updateProfilePicture(authentication, file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/profile/picture/{fileName:.+}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String fileName) {
        try {
            // fileName should be the exact path as stored in the database (e.g., 'profile-pictures/uuid.jpg')
            System.out.println("Requested profile picture: " + fileName);
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("Error loading profile picture: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(authentication, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Backend is working correctly");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<User>> getAllEnabledDoctors() {
        List<User> doctors = userService.getAllEnabledDoctors();
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/doctors/unassigned")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<User>> getUnassignedDoctors() {
        List<User> unassignedDoctors = userService.getUnassignedDoctors();
        return ResponseEntity.ok(unassignedDoctors);
    }

    @PostMapping("/secretary/apply")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> applyAsSecretary(
            Authentication authentication,
            @RequestParam("doctorId") Integer doctorId,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "file", required = false) MultipartFile cvFile
    ) {
        SecretaryApplicationRequest request = new SecretaryApplicationRequest();
        request.setDoctorId(doctorId);
        request.setMessage(message);
        
        User secretary = userService.applyAsSecretary(authentication, request, cvFile);
        return ResponseEntity.ok(secretary);
    }
    
    @GetMapping("/cv/{fileName:.+}")
    public ResponseEntity<Resource> getCVFile(
            @PathVariable String fileName,
            @RequestParam(value = "token", required = false) String token) {
        try {
            // Log the requested filename for debugging
            System.out.println("Requested CV file: " + fileName);
            
            // Handle legacy paths - if fileName doesn't contain a subdirectory, add the cvs/ prefix
            if (!fileName.contains("/")) {
                System.out.println("Adding cvs/ prefix to legacy path");
                fileName = "cvs/" + fileName;
            }
            
            // Log the final file path we're trying to load
            System.out.println("Attempting to load file from path: " + fileName);
            
            // Load the file from storage - this will throw an exception if the file doesn't exist
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            
            // Log success
            System.out.println("File loaded successfully: " + resource.getFilename());
            
            // Determine content type (default to PDF)
            MediaType contentType = MediaType.APPLICATION_PDF;
            if (fileName.toLowerCase().endsWith(".doc")) {
                contentType = MediaType.parseMediaType("application/msword");
            } else if (fileName.toLowerCase().endsWith(".docx")) {
                contentType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            }
            
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, OPTIONS")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type, Authorization")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("Error loading CV file: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for debugging
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/doctor/secretary-applications")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<User>> getSecretaryApplications(Authentication authentication) {
        List<User> applications = userService.getSecretaryApplications(authentication);
        return ResponseEntity.ok(applications);
    }
    
    @GetMapping("/doctor/secretaries")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<User>> getAssignedSecretaries(Authentication authentication) {
        List<User> secretaries = userService.getAssignedSecretaries(authentication);
        return ResponseEntity.ok(secretaries);
    }
    
    @PostMapping("/doctor/process-secretary")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> processSecretaryApplication(
            Authentication authentication,
            @Valid @RequestBody SecretaryActionRequest request
    ) {
        User secretary = userService.processSecretaryApplication(authentication, request);
        return ResponseEntity.ok(secretary);
    }
    
    @DeleteMapping("/doctor/secretary/{secretaryId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> removeSecretary(
            Authentication authentication,
            @PathVariable Integer secretaryId
    ) {
        User secretary = userService.removeSecretary(authentication, secretaryId);
        return ResponseEntity.ok(secretary);
    }
    
    @PostMapping("/doctor/secretary/{secretaryId}/toggle-access")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> toggleSecretaryAccess(
            Authentication authentication,
            @PathVariable Integer secretaryId
    ) {
        User secretary = userService.toggleSecretaryAccess(authentication, secretaryId);
        return ResponseEntity.ok(secretary);
    }
    
    @GetMapping("/secretary/doctor")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> getAssignedDoctor(Authentication authentication) {
        try {
            User doctor = userService.getAssignedDoctor(authentication);
            return ResponseEntity.ok(doctor);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<User> getDoctorById(@PathVariable Integer id) {
        User doctor = userService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }

    @GetMapping("/secretaries/unassigned")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<User>> getUnassignedSecretaries() {
        // Get all secretaries who are not assigned to any doctor
        Role secretaryRole = roleRepository.findByNom("secretaire")
                .orElseThrow(() -> new EntityNotFoundException("Secretary role not found"));
        
        List<User> unassignedSecretaries = userRepository.findByRoleAndAssignedDoctorIsNull(secretaryRole);
        return ResponseEntity.ok(unassignedSecretaries);
    }
    
    @PostMapping("/doctor/assign-secretary/{secretaryId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> assignSecretaryToDoctor(
            Authentication authentication,
            @PathVariable Integer secretaryId
    ) {
        User secretary = userService.assignSecretaryToDoctor(authentication, secretaryId);
        return ResponseEntity.ok(secretary);
    }

    @PostMapping("/upload-cv")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> uploadCV(
            Authentication authentication,
            @RequestParam("file") MultipartFile cvFile
    ) {
        if (cvFile.isEmpty() || cvFile.getContentType() == null || 
            (!cvFile.getContentType().startsWith("application/pdf") && 
             !cvFile.getContentType().startsWith("application/msword") && 
             !cvFile.getContentType().startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            return ResponseEntity.badRequest().build();
        }
        
        User updatedUser = userService.updateCV(authentication, cvFile);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/secretary/doctor-patients")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<Map<String, Object>>> getDoctorPatients(Authentication authentication) {
        try {
            // Obtenir la secrétaire actuellement connectée
            User secretary = userService.getCurrentUser(authentication);
            
            // Vérifier que la secrétaire est assignée à un médecin
            if (secretary.getAssignedDoctor() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(List.of(Map.of("error", "Vous n'êtes pas assigné(e) à un médecin")));
            }
            
            // Obtenir le médecin assigné
            User doctor = secretary.getAssignedDoctor();
            
            // Trouver tous les patients qui ont eu des rendez-vous avec ce médecin
            List<User> patients = userService.getPatientsWithAppointmentsForDoctor(doctor.getId());
            
            // Transformer les patients en une liste de maps simplifiée (sans accéder aux spécialités)
            List<Map<String, Object>> patientsList = patients.stream()
                .map(patient -> {
                    Map<String, Object> patientMap = new HashMap<>();
                    patientMap.put("id", patient.getId());
                    patientMap.put("nom", patient.getNom());
                    patientMap.put("prenom", patient.getPrenom());
                    patientMap.put("email", patient.getEmail());
                    patientMap.put("phoneNumber", patient.getPhoneNumber());
                    // Éviter d'accéder aux spécialités qui causent LazyInitializationException
                    return patientMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(patientsList);
        } catch (Exception e) {
            e.printStackTrace(); // Ajouter pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(List.of(Map.of("error", "Erreur lors de la récupération des patients: " + e.getMessage())));
        }
    }
}
