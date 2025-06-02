package com.projet.molarisse.bilan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface BilanMedicalRepository extends JpaRepository<BilanMedical, Integer> {

    List<BilanMedical> findAll();

    Optional<BilanMedical> findById(Integer id);

    @Query("SELECT b FROM BilanMedical b WHERE b.fichePatient.id = :fichePatientId ORDER BY b.id DESC")
    List<BilanMedical> findByFichePatientId(@Param("fichePatientId") Integer fichePatientId);

    void deleteById(Integer id);
} 