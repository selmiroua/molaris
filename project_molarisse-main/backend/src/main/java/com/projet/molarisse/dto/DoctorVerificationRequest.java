package com.projet.molarisse.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorVerificationRequest {
    @NotNull
    private Integer doctorId;
    
    @NotBlank
    private String address;
    
    @NotBlank
    private String cabinetAddress;
    
    @NotNull
    @Min(0)
    private Integer yearsOfExperience;
    
    private List<String> specialties;
    
    @NotBlank
    private String postalCode;
    
    @NotBlank
    private String cabinetName;
    
    @NotBlank
    private String email;
    
    @NotBlank
    private String phoneNumber;
    
    private String message;
} 