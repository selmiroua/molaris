package com.projet.molarisse.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {
    private String oldEmail;  // Used to identify the user
    private String nom;
    private String prenom;
    private String email;
    private LocalDate dateNaissance;
    private String password;
    private String certificationFilePath;
    private String patenteFilePath;
    private List<String> specialities;  // List of specialities for dentists
}
