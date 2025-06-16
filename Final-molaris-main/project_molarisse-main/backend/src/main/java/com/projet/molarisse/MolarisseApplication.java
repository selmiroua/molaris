package com.projet.molarisse;

import com.projet.molarisse.role.Role;
import com.projet.molarisse.role.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class MolarisseApplication {

    public static void main(String[] args) {
        SpringApplication.run(MolarisseApplication.class, args);
    }

    @Bean
    public CommandLineRunner runner(RoleRepository roleRepository) {
        return args -> {
            // Liste de tous les rôles à initialiser
            String[] roles = {
                Role.PATIENT,
                Role.DOCTOR,
                Role.SECRETAIRE,
                Role.PHARMACIE,
                Role.LABO,
                Role.FOURNISSEUR,
                Role.ADMIN
            };

            // Initialiser chaque rôle s'il n'existe pas
            for (String roleName : roles) {
                if (roleRepository.findByNom(roleName).isEmpty()) {
                roleRepository.save(
                        Role.builder()
                            .nom(roleName)
                            .numbers(0)
                            .build()
                );
                    System.out.println("Role " + roleName + " initialized");
                }
            }
        };
    }
}
