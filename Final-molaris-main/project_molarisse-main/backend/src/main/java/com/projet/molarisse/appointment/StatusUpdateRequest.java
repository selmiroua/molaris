package com.projet.molarisse.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatusUpdateRequest {
    private Appointment.AppointmentStatus status;
    private Integer secretaryId;
} 