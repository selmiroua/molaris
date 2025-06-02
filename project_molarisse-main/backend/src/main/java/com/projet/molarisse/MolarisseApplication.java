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
            if (roleRepository.findByNom("Patient").isEmpty() ) {
                roleRepository.save(
                        Role.builder().nom("Patient").build()
                );
            }
        };
    }
}
