package com.projet.molarisse.config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public Module hibernate5Module() {
        Hibernate5JakartaModule module = new Hibernate5JakartaModule();
        // Configure module to not force loading of lazy relationships
        module.disable(Hibernate5JakartaModule.Feature.FORCE_LAZY_LOADING);
        return module;
    }
} 