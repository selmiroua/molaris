package com.projet.molarisse.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AuthentificateRequest {
    @Email(message = "email est mal formulé")
    @NotEmpty(message = "email est obligatoire")
    @NotBlank(message = "email est obligatoire")
    private String email;
    @NotEmpty(message = "password est obligatoire")
    @NotBlank(message = "password est obligatoire")
    @Size(min=8,message = "password should be 8 characters long minimum")
    private String password;

}
