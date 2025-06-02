package com.projet.molarisse.patient;

import com.projet.molarisse.appointment.AppointmentDocument;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "fiche_patient")
public class FichePatient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "patient_id")
    private Integer patientId;

    @Column(name = "doctor_id")
    private Integer doctorId;

    @Column(name = "nom", length = 255)
    private String nom;

    @Column(name = "prenom", length = 255)
    private String prenom;
    
    @Column(name = "age")
    private Integer age;  
    
    @Column(name = "date_naissance")
    private LocalDate dateNaissance;
    
    @Column(name = "profession", length = 255)
    private String profession;

    @Column(name = "telephone", length = 255)
    private String telephone;

    @Column(name = "adresse", length = 255)
    private String adresse;
    
    @Column(name = "sexe", length = 255)
    private String sexe;  

    @Column(name = "etat_general", length = 1000)
    private String etatGeneral;

    @Column(name = "antecedents_chirurgicaux", length = 1000)
    private String antecedentsChirurgicaux;

    @Column(name = "prise_medicaments", length = 1000)
    private String priseMedicaments;

    @Column(name = "allergies", length = 1000)
    private String allergies;

    @Column(name = "dental_observations", columnDefinition = "TEXT")
    private String dentalObservations;

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_path", length = 255)
    private String documentPath;

    @Column(name = "document_type", length = 255)
    private String documentType;

    @Column(name = "document_size")
    private Long documentSize;

    @Column(name = "creation_date", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime creationDate;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "document_upload_date")
    private LocalDateTime documentUploadDate;

    @OneToMany(
        mappedBy = "fichePatient",
        cascade = {CascadeType.ALL},
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<AppointmentDocument> documents = new ArrayList<>();

    public void addDocument(AppointmentDocument document) {
        documents.add(document);
        document.setFichePatient(this);
    }

    public void removeDocument(AppointmentDocument document) {
        documents.remove(document);
        document.setFichePatient(null);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
        if (creationDate == null) {
            creationDate = LocalDateTime.now();
        }
        if (documents == null) {
            documents = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }

    @JsonProperty("date_naissance")
    public LocalDate getDateNaissance() {
        return dateNaissance;
    }
    
    @JsonProperty("date_naissance")
    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }
} 