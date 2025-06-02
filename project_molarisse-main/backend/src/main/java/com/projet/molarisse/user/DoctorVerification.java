package com.projet.molarisse.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "doctor_verifications")
public class DoctorVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "doctor_id", nullable = false)
    private Integer doctorId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VerificationStatus status;

    @Column(nullable = false)
    private String address;

    @Column(name = "cabinet_address", nullable = false)
    private String cabinetAddress;

    @Column(name = "years_of_experience", nullable = false)
    private Integer yearsOfExperience;

    @ElementCollection
    @CollectionTable(name = "doctor_specialties", joinColumns = @JoinColumn(name = "doctor_verification_id"))
    @Column(name = "specialty")
    private List<String> specialties;

    @Column(name = "postal_code", nullable = false)
    private String postalCode;

    @Column(name = "cabinet_name", nullable = false)
    private String cabinetName;

    @Column(nullable = false)
    private String email;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "cabinet_photo_path")
    private String cabinetPhotoPath;

    @Column(name = "diploma_photo_path")
    private String diplomaPhotoPath;

    private String message;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationship with User (if needed)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User doctor;

    public enum VerificationStatus {
        PENDING, APPROVED, REJECTED
    }
} 