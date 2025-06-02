package com.projet.molarisse.user;

import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/secretaries")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class SecretaryUserController {
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    /**
     * Récupère la liste de toutes les secrétaires
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSecretaries() {
        try {
            Role secretaryRole = roleRepository.findByNom("secretaire")
                .orElseThrow(() -> new EntityNotFoundException("Secretary role not found"));
                
            List<User> secretaries = userRepository.findByRole(secretaryRole);
            
            List<Map<String, Object>> secretariesList = secretaries.stream()
                .map(secretary -> {
                    Map<String, Object> secretaryMap = new HashMap<>();
                    secretaryMap.put("id", secretary.getId());
                    secretaryMap.put("nom", secretary.getNom());
                    secretaryMap.put("prenom", secretary.getPrenom());
                    secretaryMap.put("email", secretary.getEmail());
                    secretaryMap.put("phoneNumber", secretary.getPhoneNumber());
                    secretaryMap.put("role", Map.of("id", 3, "nom", "secretaire"));
                    
                    if (secretary.getAssignedDoctor() != null) {
                        Map<String, Object> doctorMap = new HashMap<>();
                        doctorMap.put("id", secretary.getAssignedDoctor().getId());
                        doctorMap.put("nom", secretary.getAssignedDoctor().getNom());
                        doctorMap.put("prenom", secretary.getAssignedDoctor().getPrenom());
                        secretaryMap.put("assignedDoctor", doctorMap);
                    }
                    
                    return secretaryMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(secretariesList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère une secrétaire par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getSecretaryById(@PathVariable Integer id) {
        try {
            Role secretaryRole = roleRepository.findByNom("secretaire")
                .orElseThrow(() -> new EntityNotFoundException("Secretary role not found"));
                
            User secretary = userRepository.findByIdAndRole(id, secretaryRole)
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found with id: " + id));
                
            return ResponseEntity.ok(secretary);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 