package com.projet.molarisse.bilan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BilanMedicalRepository extends JpaRepository<BilanMedical, Integer> {

    List<BilanMedical> findAll();

    Optional<BilanMedical> findById(Integer id);

    Optional<BilanMedical> findByFichePatientId(Integer fichePatientId);

    void deleteById(Integer id);
} 