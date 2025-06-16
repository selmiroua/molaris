package com.projet.molarisse.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UnregisteredPatientAppointmentRequest {
    // Patient information
    private String nom;
    private String prenom;
    private String email;
    private String phoneNumber;
    private LocalDate dateNaissance;
    
    // Appointment information
    private Integer doctorId;
    private LocalDateTime appointmentDateTime;
    private CaseType caseType;
    private AppointmentType appointmentType;
    private String notes;
} 