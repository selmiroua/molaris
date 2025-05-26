package com.projet.molarisse.bilan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.projet.molarisse.patient.FichePatient;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
} 