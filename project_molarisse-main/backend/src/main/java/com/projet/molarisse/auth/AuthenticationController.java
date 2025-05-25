package com.projet.molarisse.auth;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.UserService;
import com.projet.molarisse.user.User;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name= "Authentication")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthenticationController {
    private final AuthenticationService service;
    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<?> register(
            @RequestBody @Valid RegistrationRequest request

    ) throws MessagingException {
        service.register(request);
        return ResponseEntity.accepted().build();


    }
    @PostMapping("/authenticate")
    public  ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody @Valid AuthentificateRequest request
    ){
        return ResponseEntity.ok(service.authenticate(request));
    }
    @GetMapping("/activate-account")
    public  void confirm(
            @RequestParam String token
    ) throws MessagingException {
       service.activateAccount(token);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getRoles() {
        List<String> roles = service.getRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/current-user")
    public ResponseEntity<UserBasicInfoDto> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userService.getCurrentUser(authentication);
        UserBasicInfoDto dto = new UserBasicInfoDto(
            user.getPrenom(), 
            user.getNom(), 
            user.getEmail(), 
            user.getRole().getNom(),
            user.isAccountLocked()
        );
        return ResponseEntity.ok(dto);
    }

    /**
     * Endpoint to request a password reset
     * @param request The password reset request containing the user's email
     * @return A response indicating the reset email has been sent
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody @Valid PasswordResetRequest request
    ) throws MessagingException {
        service.initiatePasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Si cette adresse email est associée à un compte, un email de réinitialisation de mot de passe a été envoyé."));
    }
    
    /**
     * Endpoint to complete the password reset process
     * @param request The new password request containing the token and new password
     * @return A response indicating the password has been reset
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody @Valid NewPasswordRequest request
    ) {
        service.completePasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Votre mot de passe a été réinitialisé avec succès."));
    }
    
    /**
     * Endpoint to verify if a reset token is valid
     * @param token The token to verify
     * @return A response indicating whether the token is valid
     */
    @GetMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(
            @RequestParam String token
    ) {
        try {
            // We'll just check if the token exists and is not expired
            // The actual password reset will happen in the resetPassword endpoint
            service.activateAccount(token);
            return ResponseEntity.ok(Map.of("valid", true));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false, "message", e.getMessage()));
        }
    }
}

// DTO for returning basic user info
class UserBasicInfoDto {
    private String prenom;
    private String nom;
    private String email;
    private String role;
    private boolean accountLocked;

    public UserBasicInfoDto(String prenom, String nom, String email, String role, boolean accountLocked) {
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.role = role;
        this.accountLocked = accountLocked;
    }

    public String getPrenom() { return prenom; }
    public String getNom() { return nom; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isAccountLocked() { return accountLocked; }
}
