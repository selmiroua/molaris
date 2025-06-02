package com.projet.molarisse.appointment;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.projet.molarisse.patient.FichePatient;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "appointment_document")
public class AppointmentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = true)
    @JsonIgnore
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiche_patient_id", nullable = true)
    @JsonIgnore
    private FichePatient fichePatient;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(nullable = false)
    private String name;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @CreatedDate
    @Column(name = "creation_date", nullable = false, updatable = false)
    private LocalDateTime creationDate;

    @LastModifiedDate
    @Column(name = "modification_date", nullable = true)
    private LocalDateTime modificationDate;

    @CreatedDate
    @Column(name = "upload_date", nullable = false, updatable = false)
    private LocalDateTime uploadDate;

    @PrePersist
    protected void onCreate() {
        creationDate = LocalDateTime.now();
        uploadDate = LocalDateTime.now();
        if (documentType == null) {
            documentType = DocumentType.PATIENT;
        }
    }

    public void setFichePatient(FichePatient fichePatient) {
        this.fichePatient = fichePatient;
        if (fichePatient != null) {
            this.documentType = DocumentType.PATIENT;
        }
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
        if (appointment != null) {
            this.documentType = DocumentType.APPOINTMENT;
        }
    }

    public enum DocumentType {
        APPOINTMENT,    // Document specific to an appointment (e.g., X-rays, treatment plans)
        PATIENT        // Document specific to a patient (e.g., medical history, insurance)
    }
} 