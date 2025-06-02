package com.projet.molarisse.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentRequest {
    private Integer patientId;
    private Integer doctorId;
    private LocalDateTime appointmentDateTime;
    private CaseType caseType;
    private AppointmentType appointmentType;
    private String notes;
} 