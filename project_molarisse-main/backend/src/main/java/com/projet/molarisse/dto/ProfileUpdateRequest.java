package com.projet.molarisse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProfileUpdateRequest {
    private String prenom;

    private String nom;

    @Email(message = "Please provide a valid email address")
    private String email;

    private String address;

    @Pattern(regexp = "^[0-9]{8}$", message = "Phone number must be 8 digits")
    private String phoneNumber;
    
    private LocalDate dateNaissance;

    private String ville;

    // Doctor professional info fields
    private List<String> specialities;
    private String orderNumber; // RPPS/Order number
    private String cabinetAdresse; // Doctor's office address
}
