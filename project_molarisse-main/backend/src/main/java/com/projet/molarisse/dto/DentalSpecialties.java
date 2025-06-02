package com.projet.molarisse.dto;

import java.util.Arrays;
import java.util.List;

/**
 * Classe utilitaire qui définit les spécialités dentaires disponibles dans l'application.
 */
public class DentalSpecialties {

    /**
     * Liste des spécialités dentaires disponibles
     */
    public static final List<String> SPECIALTIES = Arrays.asList(
            "Dentisterie générale",
            "Orthodontie",
            "Chirurgie buccale et maxillo-faciale",
            "Parodontie",
            "Endodontie",
            "Prothèse dentaire",
            "Dentisterie pédiatrique",
            "Dentisterie esthétique",
            "Implantologie",
            "Radiologie buccale",
            "Médecine buccale",
            "Dentisterie gériatrique",
            "Dentisterie préventive"
    );

    /**
     * Vérifie si une spécialité est valide
     * @param specialty La spécialité à vérifier
     * @return true si la spécialité est valide, false sinon
     */
    public static boolean isValidSpecialty(String specialty) {
        return SPECIALTIES.contains(specialty);
    }

    /**
     * Vérifie si toutes les spécialités d'une liste sont valides
     * @param specialties La liste de spécialités à vérifier
     * @return true si toutes les spécialités sont valides, false sinon
     */
    public static boolean areValidSpecialties(List<String> specialties) {
        if (specialties == null || specialties.isEmpty()) {
            return false;
        }
        return SPECIALTIES.containsAll(specialties);
    }
} 