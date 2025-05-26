package com.projet.molarisse.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;



@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {
    private final JwtFilter jwtAuthFilter;
    private final JwtTokenParameterFilter jwtTokenParameterFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "Accept", 
            "Origin", 
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(req -> 
                        req.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/v1/v2/api-docs",
                                "/api/v1/v3/api-docs",
                                "/api/v1/swagger-resources/**",
                                "/api/v1/configuration/ui",
                                "/api/v1/configuration/security",
                                "/api/v1/swagger-ui/**",
                                "/api/v1/webjars/**",
                                "/api/v1/swagger-ui.html"
                        ).permitAll()
                        // Authentication endpoints - order is important!
                        .requestMatchers("/api/v1/auth/authenticate", "/api/v1/auth/register", "/api/v1/auth/roles", "/api/v1/auth/activate-account").permitAll()
                        .requestMatchers("/api/v1/auth/forgot-password", "/api/v1/auth/reset-password", "/api/v1/auth/verify-reset-token").permitAll()
                        .requestMatchers("/api/v1/auth/current-user").authenticated()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Patient endpoints
                        .requestMatchers(HttpMethod.POST, "/api/patients/{patientId}/fiche").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.PUT, "/api/patients/me/fiche").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers("/api/patients/me/**").authenticated()
                        .requestMatchers("/api/patients/{patientId}/**").hasAnyRole("DOCTOR", "SECRETAIRE")
                        // Explicit permissions for fiche endpoints
                        .requestMatchers("/api/patients/{patientId}/fiche").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers("/api/patients/*/fiche").hasAnyRole("DOCTOR", "SECRETAIRE")
                        // Messaging system endpoints
                        .requestMatchers("/api/messages/**").authenticated()
                        // Other endpoints
                        .requestMatchers(HttpMethod.POST, "/api/appointments/book").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/patient").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/patient/**").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/{appointmentId}").hasAnyRole("PATIENT", "DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/doctor/{doctorId}/appointments").hasAnyRole("PATIENT", "DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/doctor/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/my-doctor-appointments").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/secretary/**").hasRole("SECRETAIRE")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/status/{appointmentId}").hasRole("SECRETAIRE")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/update-status").hasRole("SECRETAIRE")
                        .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/fiche-patient").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/fiche-patient").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/interventions").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/interventions").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/{appointmentId}/interventions/{interventionId}").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/appointments/{appointmentId}/interventions/{interventionId}").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/documents").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/documents").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/documents/{documentId}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/appointments/{appointmentId}/documents/{documentId}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/users/doctors/{id}").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/profile/picture/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/profile/picture").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/password").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/test").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/demandes/pictures/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/doctors/accepted").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/demandes").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/demandes/secretary").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/demandes/check").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/demandes/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/demandes/{id}/status").hasRole("ADMIN")
                        .requestMatchers("/auth/current-user").authenticated()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/users/secretary/apply").hasRole("SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/users/doctor/secretary-applications").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/users/doctor/secretaries").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/users/doctor/process-secretary").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/doctor/secretary/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/users/secretary/requests").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/users/secretary/doctor").hasRole("SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/users/cv/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/secretaries/unassigned").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/users/doctor/assign-secretary/{secretaryId}").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/update-time-by-doctor/{appointmentId}").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/update-time-by-secretary/{appointmentId}").hasRole("SECRETAIRE")
                        
                        // Consultation endpoints
                        .requestMatchers(HttpMethod.POST, "/api/consultations").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.PUT, "/api/consultations/{id}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/consultations/fiche/{fichePatientId}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/consultations/{id}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        
                        .requestMatchers("/api/doctor-verifications/pending").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/doctor-verifications/{verificationId}/status").hasRole("ADMIN")
                        .requestMatchers("/api/doctor-verifications/check/*").authenticated()
                        .requestMatchers("/api/doctor-verifications/approved").permitAll()
                        .requestMatchers("/api/doctor-verifications/**").hasRole("DOCTOR")
                        
                        // Document endpoints - secure but allow access to authenticated users
                        .requestMatchers("/api/users/documents/cabinet_photos/**").permitAll()
                        .requestMatchers("/api/users/documents/diploma_docs/**").permitAll()
                        .requestMatchers("/api/users/documents/**").authenticated()
                        
                        // BilanMedical endpoints
                        .requestMatchers(HttpMethod.POST, "/api/bilans").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/bilans/{id}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/bilans/{id}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/bilans").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.DELETE, "/api/bilans/{id}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        .requestMatchers(HttpMethod.GET, "/api/bilans/fichePatient/{fichePatientId}").hasAnyRole("DOCTOR", "SECRETAIRE")
                        
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtTokenParameterFilter, JwtFilter.class);

        return http.build();
    }
    
}

