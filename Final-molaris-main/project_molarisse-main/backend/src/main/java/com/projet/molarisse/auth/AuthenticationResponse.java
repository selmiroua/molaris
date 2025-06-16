package com.projet.molarisse.auth;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AuthenticationResponse {
    private String token;
    private String role;
    private Boolean accountLocked;
    private Boolean banned;
}
