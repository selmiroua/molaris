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
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import com.projet.molarisse.dto.SecretaryApplicationRequest;
import com.projet.molarisse.dto.SecretaryActionRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.projet.molarisse.role.RoleRepository;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import java.util.function.Function;

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
            
            // Handle legacy paths - if fileName doesn't contain a subdirectory, add the profile-pictures/ prefix
            if (!fileName.contains("/")) {
                System.out.println("Adding profile-pictures/ prefix to legacy path");
                fileName = "profile-pictures/" + fileName;
            }
            
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            
            // Determine content type
            MediaType contentType = MediaType.IMAGE_JPEG;
            if (fileName.toLowerCase().endsWith(".png")) {
                contentType = MediaType.IMAGE_PNG;
            } else if (fileName.toLowerCase().endsWith(".gif")) {
                contentType = MediaType.IMAGE_GIF;
            }
            
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("Error loading profile picture: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/profile/picture-by-id/{userId}")
    public ResponseEntity<Resource> getProfilePictureById(@PathVariable Integer userId) {
        try {
            // Get the user by ID
            User user = userService.getUserById(userId);
            if (user == null || user.getProfilePicturePath() == null) {
                System.out.println("No profile picture found for user ID: " + userId);
                return ResponseEntity.notFound().build();
            }
            
            // Get the profile picture path
            String profilePicturePath = user.getProfilePicturePath();
            
            // Log the requested filename for debugging
            System.out.println("Requested profile picture for user ID: " + userId + ", path: " + profilePicturePath);
            
            // Handle legacy paths - if profilePicturePath doesn't contain a subdirectory, add the profile-pictures/ prefix
            if (!profilePicturePath.contains("/")) {
                System.out.println("Adding profile-pictures/ prefix to legacy path");
                profilePicturePath = "profile-pictures/" + profilePicturePath;
            }
            
            // Load the file from storage
            Resource resource = fileStorageService.loadFileAsResource(profilePicturePath);
            
            // Determine content type
            MediaType contentType = MediaType.IMAGE_JPEG;
            if (profilePicturePath.toLowerCase().endsWith(".png")) {
                contentType = MediaType.IMAGE_PNG;
            } else if (profilePicturePath.toLowerCase().endsWith(".gif")) {
                contentType = MediaType.IMAGE_GIF;
            }
            
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("Error loading profile picture for user ID " + userId + ": " + e.getMessage());
            e.printStackTrace();
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
    public ResponseEntity<List<Map<String, Object>>> getAssignedSecretaries(Authentication authentication) {
        List<User> secretaries = userService.getAssignedSecretaries(authentication);
        
        // Map User entities to DTOs with properly formatted dates
        List<Map<String, Object>> secretaryDtos = secretaries.stream()
            .map(secretary -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", secretary.getId());
                dto.put("nom", secretary.getNom());
                dto.put("prenom", secretary.getPrenom());
                dto.put("email", secretary.getEmail());
                dto.put("phoneNumber", secretary.getPhoneNumber());
                dto.put("address", secretary.getAddress());
                dto.put("accountLocked", secretary.isAccountLocked());
                dto.put("enabled", secretary.isEnabled());
                dto.put("cvFilePath", secretary.getCvFilePath());
                
                // Format the creation date as ISO string for JavaScript
                if (secretary.getCreationDate() != null) {
                    // Format as ISO-8601 string which JavaScript can parse
                    dto.put("creationDate", secretary.getCreationDate().toString());
                    dto.put("createdAt", secretary.getCreationDate().toString());
                }
                
                return dto;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(secretaryDtos);
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

    /**
     * Delete the CV of the authenticated secretary
     * 
     * @param authentication Current authenticated user
     * @return The updated user
     */
    @DeleteMapping("/delete-cv")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> deleteCV(Authentication authentication) {
        User updatedUser = userService.deleteCV(authentication);
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

    // New endpoints for admin statistics

    @GetMapping("/statistics/user-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUserTypeDistribution() {
        List<Map<String, Object>> distribution = new ArrayList<>();
        
        // Get counts by role
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        Role patientRole = roleRepository.findByNom("patient")
                .orElseThrow(() -> new EntityNotFoundException("Patient role not found"));
        Role secretaryRole = roleRepository.findByNom("secretaire")
                .orElseThrow(() -> new EntityNotFoundException("Secretary role not found"));
        Role adminRole = roleRepository.findByNom("admin")
                .orElseThrow(() -> new EntityNotFoundException("Admin role not found"));
        
        long doctorCount = userRepository.countByRole(doctorRole);
        long patientCount = userRepository.countByRole(patientRole);
        long secretaryCount = userRepository.countByRole(secretaryRole);
        long adminCount = userRepository.countByRole(adminRole);
        
        // Create response format
        Map<String, Object> doctors = new HashMap<>();
        doctors.put("name", "Médecins");
        doctors.put("value", doctorCount);
        distribution.add(doctors);
        
        Map<String, Object> patients = new HashMap<>();
        patients.put("name", "Patients");
        patients.put("value", patientCount);
        distribution.add(patients);
        
        Map<String, Object> secretaries = new HashMap<>();
        secretaries.put("name", "Secrétaires");
        secretaries.put("value", secretaryCount);
        distribution.add(secretaries);
        
        Map<String, Object> admins = new HashMap<>();
        admins.put("name", "Administrateurs");
        admins.put("value", adminCount);
        distribution.add(admins);
        
        return ResponseEntity.ok(distribution);
    }
    
    @GetMapping("/statistics/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getRegistrationTimeline(
            @RequestParam(defaultValue = "30") Integer days) {
        
        // Get current date and start date
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        
        // Get all users who registered within the date range
        List<User> users = userRepository.findByCreationDateBetween(
            startDate.atStartOfDay(), 
            endDate.plusDays(1).atStartOfDay()
        );
        
        // Create a map of date to count
        Map<LocalDate, Long> registrationsByDate = users.stream()
            .map(user -> user.getCreationDate().toLocalDate())
            .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        
        // Create a list of all dates in the range
        List<LocalDate> allDates = IntStream.range(0, days)
            .mapToObj(startDate::plusDays)
            .collect(Collectors.toList());
        
        // Format for the response
        List<Map<String, Object>> series = allDates.stream()
            .map(date -> {
                Map<String, Object> point = new HashMap<>();
                point.put("name", date.format(DateTimeFormatter.ofPattern("dd MMM")));
                point.put("value", registrationsByDate.getOrDefault(date, 0L));
                return point;
            })
            .collect(Collectors.toList());
        
        // Create the final response structure
        List<Map<String, Object>> response = new ArrayList<>();
        Map<String, Object> registrations = new HashMap<>();
        registrations.put("name", "Inscriptions");
        registrations.put("series", series);
        response.add(registrations);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get all users with pagination and filtering for admin
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String filter) {
        
        Map<String, Object> response = userService.getAllUsersWithPagination(page, limit, filter);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Ban or unban a user
     */
    @PostMapping("/admin/users/{userId}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> toggleUserBanStatus(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "true") boolean banned) {
        
        User user = userService.toggleUserBanStatus(userId, banned);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAllAdmins() {
        Role adminRole = roleRepository.findByNom("admin")
                .orElseThrow(() -> new EntityNotFoundException("Admin role not found"));
        List<User> admins = userRepository.findByRoleAndEnabledTrue(adminRole);
        return ResponseEntity.ok(admins);
    }
}
