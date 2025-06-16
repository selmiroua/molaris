package com.projet.molarisse.appointment;

import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import com.projet.molarisse.user.SecretaryStatus;
import com.projet.molarisse.notifications.NotificationService;
import com.projet.molarisse.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DentalInterventionRepository dentalInterventionRepository;
    private final ObjectMapper objectMapper;
    private final AppointmentDocumentRepository documentRepository;
    private final RoleRepository roleRepository;

    public Appointment bookAppointment(
        Integer patientId,
        Integer doctorId,
        LocalDateTime appointmentDateTime,
        CaseType caseType,
        AppointmentType appointmentType,
        String notes) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Check if patient already has an appointment on the same day
        LocalDateTime startOfDay = appointmentDateTime.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        
        List<Appointment> existingAppointments = appointmentRepository.findByPatientId(patientId);
        boolean hasAppointmentSameDay = existingAppointments.stream()
            .anyMatch(apt -> {
                LocalDateTime aptDateTime = apt.getAppointmentDateTime();
                boolean isSameDay = aptDateTime.isAfter(startOfDay) && aptDateTime.isBefore(endOfDay);
                // Only consider active appointments
                boolean isActive = apt.getStatus() == Appointment.AppointmentStatus.PENDING 
                    || apt.getStatus() == Appointment.AppointmentStatus.ACCEPTED;
                return isSameDay && isActive;
            });
        
        if (hasAppointmentSameDay) {
            throw new RuntimeException("Le patient a déjà un rendez-vous ce jour. Un seul rendez-vous par jour est autorisé.");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDateTime(appointmentDateTime)
                .caseType(caseType)
                .appointmentType(appointmentType)
                .status(Appointment.AppointmentStatus.ACCEPTED)
                .notes(notes)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the doctor
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String formattedDateTime = appointmentDateTime.format(formatter);
        String message = "Nouveau rendez-vous confirmé avec le patient " + patient.getNom() + " le " + formattedDateTime;
        String link = "/doctor/appointments/" + savedAppointment.getId();
        notificationService.createNotification(doctor, message, NotificationType.NEW_APPOINTMENT, link);
        
        // Also create notification for the patient about the confirmed appointment
        String patientMessage = "Votre rendez-vous avec le Dr. " + doctor.getNom() + " le " + formattedDateTime + " a été confirmé.";
        String patientLink = "/patient/appointments/" + savedAppointment.getId();
        notificationService.createNotification(patient, patientMessage, NotificationType.APPOINTMENT_UPDATED, patientLink);
        
        return savedAppointment;
    }

    public List<Appointment> getAppointmentsForPatient(Integer patientId) {
        try {
            // Verify patient exists
            User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
            
            // Get appointments
            List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
            System.out.println("Found " + appointments.size() + " appointments for patient " + patientId);
            return appointments;
        } catch (Exception e) {
            System.err.println("Error getting appointments for patient " + patientId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get appointments: " + e.getMessage());
        }
    }

    public List<Appointment> getAppointmentsForDoctor(Integer doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAppointmentsForSecretary(Integer secretaryId) {
        // Get the secretary
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new RuntimeException("Secretary not found"));
        
        // Check if secretary is assigned to a doctor
        if (secretary.getAssignedDoctor() == null || secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            throw new RuntimeException("Secretary is not assigned to any doctor or not approved");
        }
        
        // Return appointments for the assigned doctor instead of the secretary
        return appointmentRepository.findByDoctorId(secretary.getAssignedDoctor().getId());
    }

    public Appointment updateAppointmentStatus(Integer appointmentId, Appointment.AppointmentStatus status, Integer secretaryId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Handle patient-initiated cancellations (secretaryId will be null)
        if (secretaryId == null) {
            appointment.setStatus(status);
            
            Appointment updatedAppointment = appointmentRepository.save(appointment);
            
            // Notify the doctor about the cancellation
            if (updatedAppointment.getDoctor() != null) {
                String patientName = updatedAppointment.getPatient() != null ? 
                    updatedAppointment.getPatient().fullname() : "Un patient";
                String message = "Rendez-vous annulé par " + patientName;
                String link = "/doctor/appointments/" + updatedAppointment.getId();
                notificationService.createNotification(
                    updatedAppointment.getDoctor(), 
                    message, 
                    NotificationType.APPOINTMENT_UPDATED,
                    link
                );
            }
            
            return updatedAppointment;
        }
        
        // Original secretary-based logic
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new RuntimeException("Secretary not found"));
        
        // Check if secretary is assigned to the doctor for this appointment
        if (secretary.getAssignedDoctor() == null || 
            !secretary.getAssignedDoctor().getId().equals(appointment.getDoctor().getId()) ||
            secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            throw new RuntimeException("Secretary is not authorized to manage this appointment");
        }
        
        appointment.setStatus(status);
        appointment.setSecretary(secretary);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the doctor if status is changed
        if (updatedAppointment.getDoctor() != null) {
            String message = "Statut du rendez-vous modifié à " + translateStatusToFrench(status) + " par la secrétaire " + secretary.fullname();
            String link = "/doctor/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getDoctor(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        // Also notify the patient
        if (updatedAppointment.getPatient() != null) {
            String message = "Le statut de votre rendez-vous a été modifié à " + translateStatusToFrench(status) + ".";
            String link = "/patient/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getPatient(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return updatedAppointment;
    }
    
    public Appointment updateAppointmentStatusByDoctor(Integer appointmentId, Appointment.AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(status);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the patient
        if (updatedAppointment.getPatient() != null) {
            String message = "Le statut de votre rendez-vous a été modifié à " + translateStatusToFrench(status) + " par le Dr. " + 
                             updatedAppointment.getDoctor().getNom() + ".";
            String link = "/patient/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getPatient(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return updatedAppointment;
    }

    public Appointment findById(Integer appointmentId) {
        return appointmentRepository.findById(appointmentId).orElse(null);
    }

    /**
     * Get all appointments for statistics
     * @return List of all appointments
     */
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Transactional
    public Map<String, Object> saveFichePatient(Integer appointmentId, String patientData, List<MultipartFile> files, User currentUser) throws IOException {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to modify this patient file");
        }

        // Parse the patient data
        Map<String, Object> patientInfo = objectMapper.readValue(patientData, Map.class);
        
        // Update appointment with fiche patient data
        if (patientInfo.containsKey("medicalHistory")) {
            appointment.setMedicalHistory((String) patientInfo.get("medicalHistory"));
        }
        if (patientInfo.containsKey("allergies")) {
            appointment.setAllergies((String) patientInfo.get("allergies"));
        }
        if (patientInfo.containsKey("dentalObservations")) {
            appointment.setDentalObservations((String) patientInfo.get("dentalObservations"));
        }

        // Save files if provided
        List<AppointmentDocument> savedDocuments = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                AppointmentDocument document = saveDocument(appointment, file);
                savedDocuments.add(document);
            }
        }

        // Save the appointment
        appointment = appointmentRepository.save(appointment);

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("appointment", appointment);
        response.put("documents", savedDocuments);

        // Create notification for relevant users
        notifyFichePatientUpdate(appointment);

        return response;
    }

    public Map<String, Object> getFichePatient(Integer appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to view this patient file");
        }

        // Prepare response with all relevant data
        Map<String, Object> fichePatient = new HashMap<>();
        fichePatient.put("appointment", appointment);
        fichePatient.put("interventions", getInterventions(appointmentId, currentUser));
        fichePatient.put("documents", documentRepository.findByAppointmentId(appointmentId));

        return fichePatient;
    }

    public List<DentalIntervention> getInterventions(Integer appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to view interventions");
        }

        return dentalInterventionRepository.findByAppointmentId(appointmentId);
    }

    @Transactional
    public DentalIntervention addIntervention(Integer appointmentId, DentalIntervention intervention, User doctor) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify that the user is the doctor for this appointment
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("Not authorized to add interventions to this appointment");
        }

        intervention.setAppointment(appointment);
        intervention.setCreationDate(LocalDateTime.now());
        
        DentalIntervention savedIntervention = dentalInterventionRepository.save(intervention);

        // Create notification for the patient
        String message = "Nouvelle intervention dentaire ajoutée à votre rendez-vous du " + 
                        appointment.getAppointmentDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + ".";
        String link = "/patient/appointments/" + appointmentId;
        notificationService.createNotification(
            appointment.getPatient(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            link
        );

        return savedIntervention;
    }

    private boolean isAuthorizedForAppointment(User user, Appointment appointment) {
        return user.getId().equals(appointment.getPatient().getId()) || // Patient
               user.getId().equals(appointment.getDoctor().getId()) || // Doctor
               (appointment.getSecretary() != null && user.getId().equals(appointment.getSecretary().getId())); // Secretary
    }

    private void notifyFichePatientUpdate(Appointment appointment) {
        String message = "La fiche patient a été mise à jour pour le rendez-vous du " + 
                        appointment.getAppointmentDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + ".";
        
        // Notify doctor
        String doctorLink = "/doctor/appointments/" + appointment.getId();
        notificationService.createNotification(
            appointment.getDoctor(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            doctorLink
        );

        // Notify patient
        String patientLink = "/patient/appointments/" + appointment.getId();
        notificationService.createNotification(
            appointment.getPatient(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            patientLink
        );

        // Notify secretary if assigned
        if (appointment.getSecretary() != null) {
            String secretaryLink = "/secretary/appointments/" + appointment.getId();
            notificationService.createNotification(
                appointment.getSecretary(),
                message,
                NotificationType.APPOINTMENT_UPDATED,
                secretaryLink
            );
        }
    }

    private AppointmentDocument saveDocument(Appointment appointment, MultipartFile file) throws IOException {
        // Implementation for saving document
        String fileName = file.getOriginalFilename();
        String fileType = file.getContentType();
        long fileSize = file.getSize();
        
        // Save file to storage (implementation needed)
        String filePath = saveFileToStorage(file);
        
        AppointmentDocument document = AppointmentDocument.builder()
            .appointment(appointment)
            .documentType(AppointmentDocument.DocumentType.APPOINTMENT) // Set as appointment document
            .name(fileName)
            .filePath(filePath)
            .fileType(fileType)
            .fileSize(fileSize)
            .uploadDate(LocalDateTime.now())
            .build();
        
        return documentRepository.save(document);
    }

    private String saveFileToStorage(MultipartFile file) throws IOException {
        // Implementation needed for actual file storage
        // This could save to local filesystem, cloud storage, etc.
        // For now, return a placeholder path
        return "uploads/" + file.getOriginalFilename();
    }

    private void validateDocumentType(AppointmentDocument document) {
        if (document.getDocumentType() == AppointmentDocument.DocumentType.APPOINTMENT && document.getAppointment() == null) {
            throw new IllegalArgumentException("Appointment documents must be associated with an appointment");
        }
        if (document.getDocumentType() == AppointmentDocument.DocumentType.PATIENT && document.getFichePatient() == null) {
            throw new IllegalArgumentException("Patient documents must be associated with a patient file");
        }
    }

    public Appointment save(Appointment appointment) {
        // Create notification for the doctor about the rescheduled appointment
        if (appointment.getDoctor() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String formattedDateTime = appointment.getAppointmentDateTime().format(formatter);
            String message = "Rendez-vous reprogrammé par le patient " + appointment.getPatient().getNom() + 
                           " au " + formattedDateTime;
            
            String link = "/doctor/appointments/" + appointment.getId();
            notificationService.createNotification(
                appointment.getDoctor(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return appointmentRepository.save(appointment);
    }

    /**
     * Translates appointment status to French
     */
    private String translateStatusToFrench(Appointment.AppointmentStatus status) {
        switch (status) {
            case PENDING:
                return "En attente";
            case ACCEPTED:
                return "Accepté";
            case REJECTED:
                return "Rejeté";
            case COMPLETED:
                return "Terminé";
            default:
                return status.toString();
        }
    }

    /**
     * Creates a notification for the patient when their appointment time is updated
     * @param appointment The updated appointment
     * @param updatedBy User role who updated the appointment (doctor or secretary)
     */
    public void notifyAppointmentTimeUpdated(Appointment appointment, String updatedBy) {
        User patient = appointment.getPatient();
        
        if (patient != null) {
            String formattedDate = appointment.getAppointmentDateTime()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
            
            String message = String.format("Votre rendez-vous a été reprogrammé par %s pour le %s.", 
                updatedBy, formattedDate);
            
            String link = "/dashboard/patient?section=appointments";
            
            notificationService.createNotification(
                patient, 
                message,
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
    }

    // New method for secretary to create an appointment for an unregistered patient
    @Transactional
    public Appointment bookAppointmentForUnregisteredPatient(
            UnregisteredPatientAppointmentRequest request,
            Integer secretaryId) {
        
        // Verify secretary and get their assigned doctor
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new RuntimeException("Secretary not found"));
        
        // Check if secretary is assigned to the doctor and approved
        if (secretary.getAssignedDoctor() == null || secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            throw new RuntimeException("Secretary is not assigned to any doctor or not approved");
        }
        
        // Verify that the doctor ID matches the secretary's assigned doctor
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (!doctor.getId().equals(secretary.getAssignedDoctor().getId())) {
            throw new RuntimeException("Secretary can only book appointments for their assigned doctor");
        }

        // Create a temporary patient entry for the unregistered patient
        Role patientRole = roleRepository.findByNom("PATIENT")
                .orElseThrow(() -> new RuntimeException("Patient role not found"));
        
        User temporaryPatient = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .dateNaissance(request.getDateNaissance())
                .role(patientRole)
                .enabled(true)
                .accountLocked(false)
                .visible(true)
                .build();
        
        User savedPatient = userRepository.save(temporaryPatient);

        // Create the appointment
        Appointment appointment = Appointment.builder()
                .appointmentDateTime(request.getAppointmentDateTime())
                .status(Appointment.AppointmentStatus.ACCEPTED)
                .caseType(request.getCaseType())
                .appointmentType(request.getAppointmentType())
                .notes(request.getNotes())
                .patient(savedPatient)
                .doctor(doctor)
                .build();
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Trigger notification to the patient
        if (savedAppointment.getPatient() != null) {
            // Format the appointment date/time for the notification
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String formattedDateTime = savedAppointment.getAppointmentDateTime().format(formatter);
            
            // Create notification for the patient
            String message = "Nouveau rendez-vous créé avec le Dr. " + doctor.getNom() + " " + doctor.getPrenom() + 
                            " le " + formattedDateTime + ".";
            String link = "/patient/appointments/" + savedAppointment.getId();
            
            notificationService.createNotification(
                savedAppointment.getPatient(),
                message,
                NotificationType.NEW_APPOINTMENT,
                link
            );
        }
        
        return savedAppointment;
    }
    
    /**
     * Book an appointment for an unregistered patient by a doctor
     */
    @Transactional
    public Appointment bookAppointmentForUnregisteredPatientByDoctor(
            UnregisteredPatientAppointmentRequest request,
            Integer doctorId) {
        
        // Verify the doctor exists
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        // Verify that the doctor ID in the request matches the authenticated doctor's ID
        if (!doctor.getId().equals(request.getDoctorId())) {
            throw new RuntimeException("Doctor can only book appointments for themselves");
        }

        // Create a temporary patient entry for the unregistered patient
        Role patientRole = roleRepository.findByNom("PATIENT")
                .orElseThrow(() -> new RuntimeException("Patient role not found"));
        
        // Check if a patient with this email already exists
        Optional<User> existingPatient = userRepository.findByEmail(request.getEmail());
        
        User patient;
        if (existingPatient.isPresent()) {
            // Use the existing patient
            patient = existingPatient.get();
            // Update patient info if needed
            patient.setNom(request.getNom());
            patient.setPrenom(request.getPrenom());
            patient.setPhoneNumber(request.getPhoneNumber());
            if (request.getDateNaissance() != null) {
                patient.setDateNaissance(request.getDateNaissance());
            }
            patient = userRepository.save(patient);
        } else {
            // Create a new temporary patient
            User temporaryPatient = User.builder()
                    .nom(request.getNom())
                    .prenom(request.getPrenom())
                    .email(request.getEmail())
                    .phoneNumber(request.getPhoneNumber())
                    .dateNaissance(request.getDateNaissance())
                    .role(patientRole)
                    .enabled(true)
                    .accountLocked(false)
                    .visible(true)
                    .build();
            
            patient = userRepository.save(temporaryPatient);
        }

        // Create the appointment
        Appointment appointment = Appointment.builder()
                .appointmentDateTime(request.getAppointmentDateTime())
                .status(Appointment.AppointmentStatus.ACCEPTED)
                .caseType(request.getCaseType())
                .appointmentType(request.getAppointmentType())
                .notes(request.getNotes())
                .patient(patient)
                .doctor(doctor)
                .build();
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Trigger notification to the patient
        if (savedAppointment.getPatient() != null) {
            // Format the appointment date/time for the notification
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String formattedDateTime = savedAppointment.getAppointmentDateTime().format(formatter);
            
            // Create notification for the patient
            String message = "Nouveau rendez-vous créé avec le Dr. " + doctor.getNom() + " " + doctor.getPrenom() + 
                            " le " + formattedDateTime + ".";
            String link = "/patient/appointments/" + savedAppointment.getId();
            
            notificationService.createNotification(
                savedAppointment.getPatient(),
                message,
                NotificationType.NEW_APPOINTMENT,
                link
            );
        }
        
        return savedAppointment;
    }

    /**
     * Update a patient's fiche (medical information) for a specific appointment
     * Only for doctors and secretaries
     */
    @Transactional
    public Map<String, Object> updateFichePatient(Integer appointmentId, Map<String, Object> patientData, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify the user is either the doctor for this appointment or an assigned secretary
        boolean isDoctor = currentUser.getId().equals(appointment.getDoctor().getId());
        boolean isSecretary = appointment.getSecretary() != null && 
                              currentUser.getId().equals(appointment.getSecretary().getId());
        
        if (!isDoctor && !isSecretary) {
            throw new RuntimeException("Not authorized to modify this patient file");
        }
        
        // Update appointment with fiche patient data
        if (patientData.containsKey("medicalHistory")) {
            appointment.setMedicalHistory((String) patientData.get("medicalHistory"));
        }
        if (patientData.containsKey("allergies")) {
            appointment.setAllergies((String) patientData.get("allergies"));
        }
        if (patientData.containsKey("dentalObservations")) {
            appointment.setDentalObservations((String) patientData.get("dentalObservations"));
        }
        
        // Additional fields can be added here as needed
        
        // Save the appointment
        appointment = appointmentRepository.save(appointment);

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("appointment", appointment);
        
        // Create notification for relevant users
        notifyFichePatientUpdate(appointment);
        
        return response;
    }
}