package com.projet.molarisse.auth;

import jakarta.persistence.Column;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegistrationRequest {
    @NotEmpty(message = "nom est obligatoire")
    @NotBlank(message = "nom est obligatoire")
    private String nom;

    @NotEmpty(message = "prenom est obligatoire")
    @NotBlank(message = "prenom est obligatoire")
    private String prenom;
    @Email(message = "email est mal formulé")
    @NotEmpty(message = "email est obligatoire")
    @NotBlank(message = "email est obligatoire")
    private String email;
    @NotEmpty(message = "password est obligatoire")
    @NotBlank(message = "password est obligatoire")
    @Size(min = 8, message = "password should be 8 characters long minimum")
    private String password;

    @NotEmpty(message = "role est obligatoire")
    @NotBlank(message = "role est obligatoire")
    private String role;
}
