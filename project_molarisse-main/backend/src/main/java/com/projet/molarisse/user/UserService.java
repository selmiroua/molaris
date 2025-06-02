package com.projet.molarisse.user;

import com.projet.molarisse.dto.ProfileUpdateRequest;
import com.projet.molarisse.handler.BusinessErrorCodes;
import com.projet.molarisse.service.FileStorageService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import com.projet.molarisse.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;
import com.projet.molarisse.dto.SecretaryApplicationRequest;
import com.projet.molarisse.dto.SecretaryActionRequest;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.notifications.NotificationService;
import com.projet.molarisse.notification.NotificationType;
import com.projet.molarisse.user.SecretaryStatus;
import com.projet.molarisse.role.RoleRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import com.projet.molarisse.appointment.Appointment;
import com.projet.molarisse.appointment.AppointmentRepository;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserService {
    private  final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final RoleRepository roleRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmailWithSpecialities(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateProfile(Authentication authentication, UpdateProfileRequest request) {
        // First verify if the oldEmail matches the authenticated user
        String authenticatedEmail = authentication.getName();
        if (request.getOldEmail() != null && !request.getOldEmail().equals(authenticatedEmail)) {
            throw new IllegalArgumentException(BusinessErrorCodes.UNAUTHORIZED_PROFILE_MODIFICATION.getDescription());
        }

        User user = userRepository.findByEmail(request.getOldEmail() != null ? request.getOldEmail() : authenticatedEmail)
                .orElseThrow(() -> new EntityNotFoundException(BusinessErrorCodes.USER_NOT_FOUND.getDescription()));
        
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getEmail() != null && !user.getEmail().equals(request.getEmail())) {
            // Check if email is already taken
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException(BusinessErrorCodes.EMAIL_ALREADY_EXISTS.getDescription());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getDateNaissance() != null) {
            user.setDateNaissance(request.getDateNaissance());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public User updateProfile(Authentication authentication, ProfileUpdateRequest profileUpdateRequest) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        System.out.println("Received profile update request: " + profileUpdateRequest);
        
        // Update user fields only if they are provided
        if (profileUpdateRequest.getNom() != null) {
            user.setNom(profileUpdateRequest.getNom());
        }
        
        if (profileUpdateRequest.getPrenom() != null) {
            user.setPrenom(profileUpdateRequest.getPrenom());
        }
        
        if (profileUpdateRequest.getEmail() != null) {
            // Check if email is already taken by another user
            if (!user.getEmail().equals(profileUpdateRequest.getEmail()) && 
                userRepository.findByEmail(profileUpdateRequest.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(profileUpdateRequest.getEmail());
        }
        
        if (profileUpdateRequest.getAddress() != null) {
            user.setAddress(profileUpdateRequest.getAddress());
        }
        
        if (profileUpdateRequest.getPhoneNumber() != null) {
            user.setPhoneNumber(profileUpdateRequest.getPhoneNumber());
        }
        
        if (profileUpdateRequest.getDateNaissance() != null) {
            user.setDateNaissance(profileUpdateRequest.getDateNaissance());
        }

        // Update doctor professional info if user is a doctor
        if (user.getRole().getNom().equalsIgnoreCase("doctor")) {
            System.out.println("Updating doctor professional info");
            if (profileUpdateRequest.getSpecialities() != null) {
                user.setSpecialities(profileUpdateRequest.getSpecialities());
            }
            if (profileUpdateRequest.getOrderNumber() != null) {
                user.setOrderNumber(profileUpdateRequest.getOrderNumber());
            }
            if (profileUpdateRequest.getCabinetAdresse() != null) {
                user.setCabinetAdresse(profileUpdateRequest.getCabinetAdresse());
            }
            if (profileUpdateRequest.getVille() != null) {
                System.out.println("Setting ville to: " + profileUpdateRequest.getVille());
                user.setVille(profileUpdateRequest.getVille());
            }
        }

        user.setWelcomeSeen(true);

        User savedUser = userRepository.save(user);
        System.out.println("Saved user with ville: " + savedUser.getVille());
        return savedUser;
    }

    @Transactional
    public User updateProfilePicture(Authentication authentication, MultipartFile file) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Delete old profile picture if it exists
        if (user.getProfilePicturePath() != null) {
            fileStorageService.deleteFile(user.getProfilePicturePath());
        }

        // Store new profile picture in the profile-pictures subdirectory
        String fileName = fileStorageService.storeFile(file, "profile-pictures");
        user.setProfilePicturePath(fileName);

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Authentication authentication, ChangePasswordRequest request) {
        User user = getCurrentUser(authentication);
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
   
    @Transactional
    public User updateUserFiles(Authentication authentication, UpdateProfileRequest request) {
        User user = getCurrentUser(authentication);
        // Update user files based on the request
        if (request.getCertificationFilePath() != null) {
            user.setCertificationFilePath(request.getCertificationFilePath());
        }
        if (request.getPatenteFilePath() != null) {
            user.setPatenteFilePath(request.getPatenteFilePath());
        }
        if (request.getSpecialities() != null) {
            user.setSpecialities(request.getSpecialities());
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> getAllEnabledDoctors() {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        return userRepository.findByRoleAndEnabledTrue(doctorRole);
    }

    /**
     * Get all doctors who are not assigned to any secretary
     * 
     * @return List of doctors without an assigned secretary
     */
    @Transactional(readOnly = true)
    public List<User> getUnassignedDoctors() {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        
        // Get all enabled doctors
        List<User> allDoctors = userRepository.findByRoleAndEnabledTrue(doctorRole);
        
        // Filter out doctors who already have secretaries
        return allDoctors.stream()
                .filter(doctor -> doctor.getSecretaries() == null || doctor.getSecretaries().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional
    public User applyAsSecretary(Authentication authentication, SecretaryApplicationRequest request, MultipartFile cvFile) {
        User secretary = getCurrentUser(authentication);
        
        // Verify user is a secretary
        if (!secretary.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only users with secretary role can apply");
        }
        
        // Check if already assigned to a doctor
        if (secretary.getAssignedDoctor() != null && secretary.getSecretaryStatus() == SecretaryStatus.APPROVED) {
            throw new IllegalArgumentException("You are already assigned to a doctor");
        }
        
        // Find the doctor
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));
        
        // Verify doctor has doctor role
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Selected user is not a doctor");
        }
        
        // Store the CV file
        if (cvFile != null && !cvFile.isEmpty()) {
            // Delete old CV if exists
            if (secretary.getCvFilePath() != null) {
                fileStorageService.deleteFile(secretary.getCvFilePath());
            }
            
            // Store CV file in the 'cvs' subdirectory
            String fileName = fileStorageService.storeFile(cvFile, "cvs");
            secretary.setCvFilePath(fileName);
        }
        
        // Update secretary data
        secretary.setAssignedDoctor(doctor);
        secretary.setSecretaryStatus(SecretaryStatus.PENDING);
        
        // Create notification for the doctor
        String message = "Secretary " + secretary.fullname() + " has applied to work with you";
        String link = "/doctor/secretary-applications";
        notificationService.createNotification(doctor, message, NotificationType.SECRETARY_APPLICATION, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional
    public User processSecretaryApplication(Authentication authentication, SecretaryActionRequest request) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can process secretary applications");
        }
        
        // Find the secretary
        User secretary = userRepository.findById(request.getSecretaryId())
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Verify this secretary has applied to this doctor
        if (secretary.getAssignedDoctor() == null || !secretary.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This secretary has not applied to work with you");
        }
        
        // Update secretary status
        secretary.setSecretaryStatus(request.getAction());
        
        // If rejected, clear the assignedDoctor
        if (request.getAction() == SecretaryStatus.REJECTED) {
            secretary.setAssignedDoctor(null);
        }
        
        // Create notification for the secretary
        String statusText = request.getAction() == SecretaryStatus.APPROVED ? "approved" : "rejected";
        String message = "Doctor " + doctor.fullname() + " has " + statusText + " your application";
        String link = "/secretary/dashboard";
        notificationService.createNotification(secretary, message, NotificationType.SECRETARY_APPLICATION_RESPONSE, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional
    public User removeSecretary(Authentication authentication, Integer secretaryId) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can remove assigned secretaries");
        }
        
        // Find the secretary
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Verify this secretary is assigned to this doctor
        if (secretary.getAssignedDoctor() == null || !secretary.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This secretary is not assigned to you");
        }
        
        // Remove assignment
        secretary.setAssignedDoctor(null);
        secretary.setSecretaryStatus(SecretaryStatus.NONE);
        
        // Create notification for the secretary
        String message = "Doctor " + doctor.fullname() + " has removed you from their team";
        String link = "/secretary/dashboard";
        notificationService.createNotification(secretary, message, NotificationType.SECRETARY_REMOVED, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional(readOnly = true)
    public List<User> getSecretaryApplications(Authentication authentication) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can view secretary applications");
        }
        
        return userRepository.findByAssignedDoctorIdAndSecretaryStatus(doctor.getId(), SecretaryStatus.PENDING);
    }
    
    @Transactional(readOnly = true)
    public List<User> getAssignedSecretaries(Authentication authentication) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can view their secretaries");
        }
        
        return userRepository.findByAssignedDoctorIdAndSecretaryStatus(doctor.getId(), SecretaryStatus.APPROVED);
    }
    
    @Transactional(readOnly = true)
    public User getAssignedDoctor(Authentication authentication) {
        User secretary = getCurrentUser(authentication);
        
        // Verify user is a secretary
        if (!secretary.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only secretaries can view their assigned doctor");
        }
        
        if (secretary.getAssignedDoctor() == null) {
            throw new EntityNotFoundException("You are not assigned to any doctor");
        }
        
        return secretary.getAssignedDoctor();
    }

    @Transactional(readOnly = true)
    public User getDoctorById(Integer id) {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
                
        return userRepository.findByIdAndRole(id, doctorRole)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with id: " + id));
    }
    
    /**
     * Assign a secretary directly to a doctor
     * 
     * @param authentication the current authenticated user (must be a doctor)
     * @param secretaryId the ID of the secretary to assign
     * @return the updated secretary user
     */
    @Transactional
    public User assignSecretaryToDoctor(Authentication authentication, Integer secretaryId) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can assign secretaries");
        }
        
        // Find the secretary
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Verify secretary has secretary role
        if (!secretary.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Selected user is not a secretary");
        }
        
        // Check if secretary is already assigned to a doctor
        if (secretary.getAssignedDoctor() != null && secretary.getSecretaryStatus() == SecretaryStatus.APPROVED) {
            throw new IllegalArgumentException("This secretary is already assigned to a doctor");
        }
        
        // Assign secretary to doctor
        secretary.setAssignedDoctor(doctor);
        secretary.setSecretaryStatus(SecretaryStatus.APPROVED);
        
        // Create notification for the secretary
        String message = "Doctor " + doctor.fullname() + " has assigned you as their secretary";
        String link = "/secretary/dashboard";
        notificationService.createNotification(secretary, message, NotificationType.SECRETARY_APPLICATION_RESPONSE, link);
        
        return userRepository.save(secretary);
    }

    @Transactional
    public User updateCV(Authentication authentication, MultipartFile cvFile) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Verify user is a secretary
        if (!user.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only users with secretary role can upload a CV");
        }
        
        // Delete old CV if exists
        if (user.getCvFilePath() != null) {
            fileStorageService.deleteFile(user.getCvFilePath());
        }
        
        // Store new CV file in the 'cvs' subdirectory
        String fileName = fileStorageService.storeFile(cvFile, "cvs");
        user.setCvFilePath(fileName);
        
        return userRepository.save(user);
    }
    
    /**
     * Delete a secretary's CV
     * 
     * @param authentication Current authenticated user
     * @return The updated user with CV file path set to null
     */
    @Transactional
    public User deleteCV(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Verify user is a secretary
        if (!user.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only users with secretary role can delete a CV");
        }
        
        // Delete CV if exists
        if (user.getCvFilePath() != null) {
            String cvPath = user.getCvFilePath();
            // Use the normalized path to ensure correct deletion
            String normalizedPath = getNormalizedCVPath(cvPath);
            fileStorageService.deleteFile(normalizedPath);
            
            // Update user in database
            user.setCvFilePath(null);
            return userRepository.save(user);
        }
        
        // If no CV exists, just return the user
        return user;
    }
    
    /**
     * Helper method to ensure CV path has the correct prefix
     * This handles legacy paths that may not include the subdirectory
     */
    public String getNormalizedCVPath(String cvPath) {
        if (cvPath == null) {
            return null;
        }
        
        // If path already contains a directory separator, assume it's correctly formatted
        if (cvPath.contains("/")) {
            return cvPath;
        }
        
        // Otherwise, add the cvs/ prefix
        return "cvs/" + cvPath;
    }

    /**
     * Récupère la liste des patients qui ont des rendez-vous avec un médecin spécifique
     * 
     * @param doctorId L'ID du médecin
     * @return La liste des patients
     */
    @Transactional(readOnly = true)
    public List<User> getPatientsWithAppointmentsForDoctor(Integer doctorId) {
        // Vérifier que le médecin existe
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
                
        User doctor = userRepository.findByIdAndRole(doctorId, doctorRole)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with id: " + doctorId));
        
        // Obtenir tous les rendez-vous du médecin
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
        
        // Extraire les patients uniques
        Map<Integer, User> patientMap = new HashMap<>();
        
        for (Appointment appointment : appointments) {
            User patient = appointment.getPatient();
            if (patient != null && !patientMap.containsKey(patient.getId())) {
                // Précharger explicitement les spécialités pour éviter LazyInitializationException
                if (patient.getSpecialities() != null) {
                    patient.getSpecialities().size(); // Force l'initialisation
                }
                patientMap.put(patient.getId(), patient);
            }
        }
        
        return new ArrayList<>(patientMap.values());
    }
    
    @Transactional
    public User toggleSecretaryAccess(Authentication authentication, Integer secretaryId) {
        User doctor = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));
        
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Check if this secretary is assigned to the doctor
        if (secretary.getAssignedDoctor() == null || !secretary.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This secretary is not assigned to you");
        }
        
        // Toggle the account locked status
        secretary.setAccountLocked(!secretary.isAccountLocked());
        
        // Create notification for the secretary
        String notificationMessage = secretary.isAccountLocked() 
                ? "Votre accès au tableau de bord a été désactivé par le Dr. " + doctor.getNom() + " " + doctor.getPrenom()
                : "Votre accès au tableau de bord a été réactivé par le Dr. " + doctor.getNom() + " " + doctor.getPrenom();
        
        notificationService.createNotification(
                secretary.getId(),
                notificationMessage,
                secretary.isAccountLocked() ? NotificationType.ACCESS_DISABLED : NotificationType.ACCESS_ENABLED
        );
        
        return userRepository.save(secretary);
    }

    @Transactional(readOnly = true)
    public User getUserById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }
    
    /**
     * Get all users with pagination and filtering
     * 
     * @param page The page number (1-based)
     * @param limit The number of items per page
     * @param filter Optional filter for name, email, or role
     * @return Map containing users and total count
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAllUsersWithPagination(int page, int limit, String filter) {
        // Adjust page for 0-based indexing
        int pageIndex = page - 1;
        if (pageIndex < 0) pageIndex = 0;
        
        List<User> allUsers = userRepository.findAll();
        List<User> filteredUsers = new ArrayList<>();
        
        // Apply filtering if provided
        if (filter != null && !filter.trim().isEmpty()) {
            String lowercaseFilter = filter.toLowerCase();
            filteredUsers = allUsers.stream()
                    .filter(user -> 
                        (user.getNom() != null && user.getNom().toLowerCase().contains(lowercaseFilter)) ||
                        (user.getPrenom() != null && user.getPrenom().toLowerCase().contains(lowercaseFilter)) ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(lowercaseFilter)) ||
                        (user.getRole() != null && user.getRole().getNom().toLowerCase().contains(lowercaseFilter))
                    )
                    .collect(Collectors.toList());
        } else {
            filteredUsers = allUsers;
        }
        
        // Calculate total and paginate
        int total = filteredUsers.size();
        int startIndex = pageIndex * limit;
        int endIndex = Math.min(startIndex + limit, total);
        
        List<User> pagedUsers = (startIndex < total) 
            ? filteredUsers.subList(startIndex, endIndex) 
            : new ArrayList<>();
        
        // Convert to response format
        Map<String, Object> response = new HashMap<>();
        response.put("users", pagedUsers);
        response.put("total", total);
        response.put("page", page);
        response.put("limit", limit);
        
        return response;
    }
    
    /**
     * Toggle the ban status of a user
     * 
     * @param userId The user ID
     * @param banned The new ban status
     * @return Updated user
     */
    @Transactional
    public User toggleUserBanStatus(Integer userId, boolean banned) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        // Don't allow banning of admins
        if (user.getRole().getNom().equalsIgnoreCase("admin")) {
            throw new IllegalArgumentException("Admin users cannot be banned");
        }
        
        user.setBanned(banned);
        
        // If banning, create a notification for the user
        if (banned) {
            notificationService.createNotification(
                user,
                "Votre compte a été suspendu par un administrateur. Veuillez contacter l'assistance pour plus d'informations.",
                NotificationType.ACCESS_DISABLED,
                "/login"
            );
        }
        
        return userRepository.save(user);
    }

    /**
     * Find a user by email
     * @param email The email to search for
     * @return The user with the given email, or null if not found
     */
    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
}
