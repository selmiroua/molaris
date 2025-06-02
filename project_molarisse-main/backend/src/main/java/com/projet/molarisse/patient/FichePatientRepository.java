package com.projet.molarisse.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

@Repository
@Transactional
public interface FichePatientRepository extends JpaRepository<FichePatient, Integer> {
    @Query("SELECT f FROM FichePatient f WHERE f.patientId = ?1 ORDER BY f.updatedAt DESC")
    List<FichePatient> findAllByPatientIdOrderByUpdatedAtDesc(Integer patientId);

    @Transactional(readOnly = true)
    default Optional<FichePatient> findByPatientId(Integer patientId) {
        List<FichePatient> fiches = findAllByPatientIdOrderByUpdatedAtDesc(patientId);
        return fiches.isEmpty() ? Optional.empty() : Optional.of(fiches.get(0));
    }

    @Transactional(readOnly = true)
    boolean existsByPatientId(Integer patientId);

    @Override
    @Transactional
    <S extends FichePatient> S save(S entity);
} 