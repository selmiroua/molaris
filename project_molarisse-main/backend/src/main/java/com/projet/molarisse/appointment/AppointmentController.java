package com.projet.molarisse.appointment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.SecretaryStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookAppointment(@RequestBody AppointmentRequest request) {
        try {
            Appointment appointment = appointmentService.bookAppointment(
                    request.getPatientId(),
                    request.getDoctorId(),
                    request.getAppointmentDateTime(),
                    request.getCaseType(),
                    request.getAppointmentType(),
                    request.getNotes());
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                   .body(Map.of("error", e.getMessage()));
        }
    }




    @GetMapping("/my-doctor-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getMyDoctorAppointments() {
        // Get the authenticated doctor
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User doctor = (User) authentication.getPrincipal();
        Integer doctorId = doctor.getId();

        List<Appointment> appointments = appointmentService.getAppointmentsForDoctor(doctorId);

        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
                .map(appointment -> {
                    Map<String, Object> simplified = new HashMap<>();
                    simplified.put("id", appointment.getId());
                    simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                    simplified.put("status", appointment.getStatus());
                    simplified.put("appointmentType", appointment.getAppointmentType());
                    simplified.put("caseType", appointment.getCaseType());
                    simplified.put("notes", appointment.getNotes());

                    if (appointment.getPatient() != null) {
                        Map<String, Object> patient = new HashMap<>();
                        patient.put("id", appointment.getPatient().getId());
                        patient.put("nom", appointment.getPatient().getNom());
                        patient.put("prenom", appointment.getPatient().getPrenom());
                        patient.put("email", appointment.getPatient().getEmail());
                        patient.put("phoneNumber", appointment.getPatient().getPhoneNumber());
                        simplified.put("patient", patient);
                    }

                    return simplified;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(simplifiedAppointments);
    }



    @GetMapping("/secretary/{secretaryId}")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<Appointment>> getAppointmentsForSecretary(
            @PathVariable Integer secretaryId,
            Authentication authentication
    ) {
        // Verify the authenticated user is the requested secretary
        User authenticatedUser = (User) authentication.getPrincipal();
        if (!authenticatedUser.getId().equals(secretaryId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            List<Appointment> appointments = appointmentService.getAppointmentsForSecretary(secretaryId);
            return ResponseEntity.ok(appointments);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
        }
    }

    @PutMapping("/status/{appointmentId}")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Integer appointmentId,
            @RequestBody Map<String, String> statusMap,
            Authentication authentication
    ) {
        User secretary = (User) authentication.getPrincipal();
        Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusMap.get("status"));

        try {
            Appointment updatedAppointment = appointmentService.updateAppointmentStatus(appointmentId, status, secretary.getId());
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Map<String, Object>>> getMyAppointments() {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        Integer patientId = user.getId();

        List<Appointment> appointments = appointmentService.getAppointmentsForPatient(patientId);

        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
                .map(appointment -> {
                    Map<String, Object> simplified = new HashMap<>();
                    simplified.put("id", appointment.getId());
                    simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                    simplified.put("status", appointment.getStatus());
                    simplified.put("appointmentType", appointment.getAppointmentType());
                    simplified.put("caseType", appointment.getCaseType());
                    simplified.put("notes", appointment.getNotes());

                    if (appointment.getDoctor() != null) {
                        Map<String, Object> doctor = new HashMap<>();
                        doctor.put("id", appointment.getDoctor().getId());
                        doctor.put("nom", appointment.getDoctor().getNom());
                        doctor.put("prenom", appointment.getDoctor().getPrenom());
                        doctor.put("email", appointment.getDoctor().getEmail());
                        doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                        simplified.put("doctor", doctor);
                    }

                    return simplified;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(simplifiedAppointments);
    }

    // Keep the old method for backward compatibility but make it admin-only
    @GetMapping("/patient/{patientId}/simplified")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPatientAppointmentsSimplified(@PathVariable Integer patientId) {
        List<Appointment> appointments = appointmentService.getAppointmentsForPatient(patientId);

        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
                .map(appointment -> {
                    Map<String, Object> simplified = new HashMap<>();
                    simplified.put("id", appointment.getId());
                    simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                    simplified.put("status", appointment.getStatus());
                    simplified.put("appointmentType", appointment.getAppointmentType());
                    simplified.put("caseType", appointment.getCaseType());
                    simplified.put("notes", appointment.getNotes());

                    if (appointment.getDoctor() != null) {
                        Map<String, Object> doctor = new HashMap<>();
                        doctor.put("id", appointment.getDoctor().getId());
                        doctor.put("nom", appointment.getDoctor().getNom());
                        doctor.put("prenom", appointment.getDoctor().getPrenom());
                        doctor.put("email", appointment.getDoctor().getEmail());
                        doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                        simplified.put("doctor", doctor);
                    }

                    return simplified;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(simplifiedAppointments);
    }

    @PutMapping("/update-my-appointment-status")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Appointment> updateMyAppointmentStatus(
            @RequestParam Integer appointmentId,
            @RequestBody Map<String, String> statusMap,
            Authentication authentication
    ) {
        User doctor = (User) authentication.getPrincipal();
        Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusMap.get("status"));

        try {
            // Verify the doctor owns this appointment
            Appointment appointment = appointmentService.findById(appointmentId);
            if (appointment == null || !appointment.getDoctor().getId().equals(doctor.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Appointment updatedAppointment = appointmentService.updateAppointmentStatusByDoctor(appointmentId, status);
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{appointmentId}/fiche-patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> saveFichePatient(
            @PathVariable Integer appointmentId,
            @RequestParam("patientData") String patientData,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            Map<String, Object> result = appointmentService.saveFichePatient(appointmentId, patientData, files, currentUser);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{appointmentId}/fiche-patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> getFichePatient(
            @PathVariable Integer appointmentId,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            Map<String, Object> fichePatient = appointmentService.getFichePatient(appointmentId, currentUser);
            return ResponseEntity.ok(fichePatient);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{appointmentId}/interventions")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> getInterventions(
            @PathVariable Integer appointmentId,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            List<DentalIntervention> interventions = appointmentService.getInterventions(appointmentId, currentUser);
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{appointmentId}/interventions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> addIntervention(
            @PathVariable Integer appointmentId,
            @RequestBody DentalIntervention intervention,
            Authentication authentication
    ) {
        try {
            User doctor = (User) authentication.getPrincipal();
            DentalIntervention savedIntervention = appointmentService.addIntervention(appointmentId, intervention, doctor);
            return ResponseEntity.ok(savedIntervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/doctor/{doctorId}/appointments")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(
            @PathVariable Integer doctorId,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            List<Appointment> appointments = appointmentService.getAppointmentsForDoctor(doctorId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(List.of());
        }
    }

    @GetMapping("/patient")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Map<String, Object>>> getCurrentPatientAppointments(Authentication authentication) {
        // Get the authenticated patient
        User patient = (User) authentication.getPrincipal();

        List<Appointment> appointments = appointmentService.getAppointmentsForPatient(patient.getId());

        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
                .map(appointment -> {
                    Map<String, Object> simplified = new HashMap<>();
                    simplified.put("id", appointment.getId());
                    simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                    simplified.put("status", appointment.getStatus());
                    simplified.put("appointmentType", appointment.getAppointmentType());
                    simplified.put("caseType", appointment.getCaseType());
                    simplified.put("notes", appointment.getNotes());

                    if (appointment.getDoctor() != null) {
                        Map<String, Object> doctor = new HashMap<>();
                        doctor.put("id", appointment.getDoctor().getId());
                        doctor.put("nom", appointment.getDoctor().getNom());
                        doctor.put("prenom", appointment.getDoctor().getPrenom());
                        doctor.put("email", appointment.getDoctor().getEmail());
                        doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                        simplified.put("doctor", doctor);
                    }

                    return simplified;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(simplifiedAppointments);
    }

    @PutMapping("/update/{appointmentId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Integer appointmentId,
            @RequestBody UpdateAppointmentRequest updateRequest,
            Authentication authentication
    ) {
        User patient = (User) authentication.getPrincipal();

        try {
            // Verify that the appointment belongs to the authenticated patient
            Appointment existingAppointment = appointmentService.findById(appointmentId);
            if (existingAppointment == null || !existingAppointment.getPatient().getId().equals(patient.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Update only allowed fields
            existingAppointment.setAppointmentDateTime(updateRequest.getAppointmentDateTime());
            existingAppointment.setNotes(updateRequest.getNotes());

            // Reset status to PENDING when rescheduling
            existingAppointment.setStatus(Appointment.AppointmentStatus.PENDING);

            Appointment savedAppointment = appointmentService.save(existingAppointment);
            return ResponseEntity.ok(savedAppointment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // Add new endpoint to get appointments for secretary's assigned doctor
    @GetMapping("/my-secretary-appointments")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<Map<String, Object>>> getMySecretaryAppointments() {
        // Get the authenticated secretary
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User secretary = (User) authentication.getPrincipal();
        Integer secretaryId = secretary.getId();

        try {
            // Use the existing service method to get appointments for the secretary's assigned doctor
            List<Appointment> appointments = appointmentService.getAppointmentsForSecretary(secretaryId);

            // Format the response the same way as doctor appointments
            List<Map<String, Object>> simplifiedAppointments = appointments.stream()
                    .map(appointment -> {
                        Map<String, Object> simplified = new HashMap<>();
                        simplified.put("id", appointment.getId());
                        simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                        simplified.put("status", appointment.getStatus());
                        simplified.put("appointmentType", appointment.getAppointmentType());
                        simplified.put("caseType", appointment.getCaseType());
                        simplified.put("notes", appointment.getNotes());

                        // Include doctor information
                        if (appointment.getDoctor() != null) {
                            Map<String, Object> doctor = new HashMap<>();
                            doctor.put("id", appointment.getDoctor().getId());
                            doctor.put("nom", appointment.getDoctor().getNom());
                            doctor.put("prenom", appointment.getDoctor().getPrenom());
                            doctor.put("email", appointment.getDoctor().getEmail());
                            doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                            simplified.put("doctor", doctor);
                        }

                        // Include patient information
                        if (appointment.getPatient() != null) {
                            Map<String, Object> patient = new HashMap<>();
                            patient.put("id", appointment.getPatient().getId());
                            patient.put("nom", appointment.getPatient().getNom());
                            patient.put("prenom", appointment.getPatient().getPrenom());
                            patient.put("email", appointment.getPatient().getEmail());
                            patient.put("phoneNumber", appointment.getPatient().getPhoneNumber());
                            simplified.put("patient", patient);
                        }

                        return simplified;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(simplifiedAppointments);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(List.of(Map.of("error", "You are not assigned to a doctor or not approved")));
        }
    }

    // Add a new endpoint for secretaries to update appointment status
    @PutMapping("/update-secretary-appointment-status")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<Appointment> updateAppointmentStatusBySecretary(
            @RequestParam Integer appointmentId,
            @RequestBody Map<String, String> statusMap,
            Authentication authentication
    ) {
        User secretary = (User) authentication.getPrincipal();
        Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusMap.get("status"));

        try {
            Appointment updatedAppointment = appointmentService.updateAppointmentStatus(appointmentId, status, secretary.getId());
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // For DOCTOR
    @PutMapping("/update-time-by-doctor/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Appointment> updateAppointmentTimeByDoctor(
            @PathVariable Integer appointmentId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        User doctor = (User) authentication.getPrincipal();
        Appointment appointment = appointmentService.findById(appointmentId);
        if (appointment == null || !appointment.getDoctor().getId().equals(doctor.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LocalDateTime newTime = LocalDateTime.parse(body.get("appointmentDateTime"));
        appointment.setAppointmentDateTime(newTime);
        Appointment saved = appointmentService.save(appointment);
        
        // Send notification to patient
        String doctorName = "Dr. " + doctor.getPrenom() + " " + doctor.getNom();
        appointmentService.notifyAppointmentTimeUpdated(saved, doctorName);
        
        return ResponseEntity.ok(saved);
    }

    // For SECRETARY
    @PutMapping("/update-time-by-secretary/{appointmentId}")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<Appointment> updateAppointmentTimeBySecretary(
            @PathVariable Integer appointmentId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        User secretary = (User) authentication.getPrincipal();
        Appointment appointment = appointmentService.findById(appointmentId);
        if (appointment == null ||
            secretary.getAssignedDoctor() == null ||
            !secretary.getAssignedDoctor().getId().equals(appointment.getDoctor().getId()) ||
            secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LocalDateTime newTime = LocalDateTime.parse(body.get("appointmentDateTime"));
        appointment.setAppointmentDateTime(newTime);
        Appointment saved = appointmentService.save(appointment);
        
        // Send notification to patient
        String doctorName = "Dr. " + appointment.getDoctor().getPrenom() + " " + appointment.getDoctor().getNom();
        String secretaryName = secretary.getPrenom() + " " + secretary.getNom() + " (secrétaire de " + doctorName + ")";
        appointmentService.notifyAppointmentTimeUpdated(saved, secretaryName);
        
        return ResponseEntity.ok(saved);
    }
    
    // New endpoint for secretary to book appointment for unregistered patient
    @PostMapping("/book-for-unregistered-patient")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<?> bookAppointmentForUnregisteredPatient(
            @RequestBody UnregisteredPatientAppointmentRequest request,
            Authentication authentication) {
        try {
            User secretary = (User) authentication.getPrincipal();
            Appointment appointment = appointmentService.bookAppointmentForUnregisteredPatient(
                    request,
                    secretary.getId());
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                   .body(Map.of("error", e.getMessage()));
        }
    }

    // New endpoint for doctors to book appointments for existing patients
    @PostMapping("/book-by-doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> bookAppointmentByDoctor(@RequestBody AppointmentRequest request) {
        try {
            // Get the authenticated doctor
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User doctor = (User) authentication.getPrincipal();
            
            // Verify that the doctor booking the appointment is the same as the doctor in the request
            if (!doctor.getId().equals(request.getDoctorId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                       .body(Map.of("error", "Vous ne pouvez pas créer un rendez-vous pour un autre médecin"));
            }
            
            Appointment appointment = appointmentService.bookAppointment(
                    request.getPatientId(),
                    request.getDoctorId(),
                    request.getAppointmentDateTime(),
                    request.getCaseType(),
                    request.getAppointmentType(),
                    request.getNotes());
            
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                   .body(Map.of("error", e.getMessage()));
        }
    }

    // New endpoint for secretaries to book appointments for existing patients
    @PostMapping("/book-by-secretary")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<?> bookAppointmentBySecretary(@RequestBody AppointmentRequest request) {
        try {
            // Get the authenticated secretary
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User secretary = (User) authentication.getPrincipal();
            
            // Check if secretary is assigned to a doctor and approved
            if (secretary.getAssignedDoctor() == null || 
                secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                       .body(Map.of("error", "Vous n'êtes pas assigné à un médecin ou votre compte n'est pas approuvé"));
            }
            
            // Verify that the secretary is booking for their assigned doctor
            if (!secretary.getAssignedDoctor().getId().equals(request.getDoctorId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                       .body(Map.of("error", "Vous ne pouvez pas créer un rendez-vous pour un autre médecin"));
            }
            
            Appointment appointment = appointmentService.bookAppointment(
                    request.getPatientId(),
                    request.getDoctorId(),
                    request.getAppointmentDateTime(),
                    request.getCaseType(),
                    request.getAppointmentType(),
                    request.getNotes());
            
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                   .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/current-doctor-id")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getCurrentDoctorId(Authentication authentication) {
        User doctor = (User) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("id", doctor.getId()));
    }
}