package com.projet.molarisse.bilan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.projet.molarisse.patient.FichePatient;
import com.projet.molarisse.appointment.AppointmentDocument;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bilan_medical")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BilanMedical {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiche_patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private FichePatient fichePatient;

    @Column(name = "blood_pressure_systolic")
    private Integer bloodPressureSystolic;

    @Column(name = "blood_pressure_diastolic")
    private Integer bloodPressureDiastolic;

    @Column(name = "maladies_particulieres", columnDefinition = "TEXT")
    private String maladiesParticulieres;

    @Column(name = "allergies_text", columnDefinition = "TEXT")
    private String allergiesText;

    @Column(name = "tooth_data", columnDefinition = "TEXT")
    private String toothData;

    @Column(name = "cosmetic_treatments", columnDefinition = "TEXT")
    private String cosmeticTreatments;

    @OneToMany(mappedBy = "bilanMedical", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private java.util.List<BilanDocument> documents = new java.util.ArrayList<>();

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_path", length = 255)
    private String documentPath;

    @Column(name = "document_type", length = 255)
    private String documentType;

    @Column(name = "document_size")
    private Long documentSize;

    @Column(name = "document_upload_date")
    private LocalDateTime documentUploadDate;

    @Column(name = "amount_to_pay", precision = 10, scale = 2)
    private BigDecimal amountToPay;

    @Column(name = "amount_paid", precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "profit", precision = 10, scale = 2)
    private BigDecimal profit;

    @Column(name = "remaining_to_pay", precision = 10, scale = 2)
    private BigDecimal remainingToPay;
} 