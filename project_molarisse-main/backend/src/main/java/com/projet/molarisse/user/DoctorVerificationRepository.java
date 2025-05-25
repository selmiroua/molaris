package com.projet.molarisse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorVerificationRepository extends JpaRepository<DoctorVerification, Integer> {
    
    Optional<DoctorVerification> findByDoctorId(Integer doctorId);
    
    List<DoctorVerification> findByStatus(DoctorVerification.VerificationStatus status);
} 