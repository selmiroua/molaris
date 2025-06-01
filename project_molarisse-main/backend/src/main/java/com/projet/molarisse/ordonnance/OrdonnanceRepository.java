package com.projet.molarisse.ordonnance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    // Custom queries can be added here
} 