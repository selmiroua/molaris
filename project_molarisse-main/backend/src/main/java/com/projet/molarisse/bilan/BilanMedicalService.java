package com.projet.molarisse.bilan;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.projet.molarisse.service.FileStorageService;
import java.time.LocalDateTime;
import com.projet.molarisse.appointment.Appointment;
import com.projet.molarisse.appointment.AppointmentRepository;
import com.projet.molarisse.bilan.BilanDocument;
import com.projet.molarisse.bilan.BilanDocumentRepository;

@Service
public class BilanMedicalService {
    private static final Logger logger = LoggerFactory.getLogger(BilanMedicalService.class);

    @Autowired
    private BilanMedicalRepository bilanMedicalRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BilanDocumentRepository bilanDocumentRepository;

    @Transactional
    public BilanMedical saveBilan(BilanMedical bilan) {
        logger.info("Saving BilanMedical with ID: {}", bilan.getId());
        logger.info("BilanMedical toothData before saving: {}", bilan.getToothData());
        return bilanMedicalRepository.save(bilan);
    }

    public Optional<BilanMedical> getBilan(Integer id) {
        return bilanMedicalRepository.findById(id);
    }

    public List<BilanMedical> getAllBilans() {
        return bilanMedicalRepository.findAll();
    }

    public Optional<BilanMedical> getBilanByFichePatientId(Integer fichePatientId) {
        List<BilanMedical> bilans = bilanMedicalRepository.findByFichePatientId(fichePatientId);
        return bilans.isEmpty() ? Optional.empty() : Optional.of(bilans.get(0));
    }

    public void deleteBilan(Integer id) {
        bilanMedicalRepository.deleteById(id);
    }

    @Transactional
    public BilanMedical addDocumentToBilan(Integer bilanId, BilanDocument document) {
        BilanMedical bilan = bilanMedicalRepository.findById(bilanId)
            .orElseThrow(() -> new RuntimeException("BilanMedical not found"));
        
        // Save the document first (if not already persisted)
        BilanDocument savedDoc = bilanDocumentRepository.save(document);
        
        // Add to the list and set the relationship
        savedDoc.setBilanMedical(bilan);
        bilan.getDocuments().add(savedDoc);
        
        // Save the bilan (this will update the foreign key)
        return bilanMedicalRepository.save(bilan);
    }

    @Transactional
    public BilanMedical saveBilanWithDocuments(BilanMedical bilan, List<MultipartFile> files) {
        BilanMedical savedBilan;
        if (bilan.getId() != null) {
            // Fetch the existing Bilan from the DB
            savedBilan = bilanMedicalRepository.findById(bilan.getId())
                .orElseThrow(() -> new RuntimeException("BilanMedical not found"));
            // Copy updatable fields from the incoming bilan to savedBilan, EXCEPT documents
            savedBilan.setBloodPressureSystolic(bilan.getBloodPressureSystolic());
            savedBilan.setBloodPressureDiastolic(bilan.getBloodPressureDiastolic());
            savedBilan.setMaladiesParticulieres(bilan.getMaladiesParticulieres());
            savedBilan.setAllergiesText(bilan.getAllergiesText());
            savedBilan.setToothData(bilan.getToothData());
            savedBilan.setCosmeticTreatments(bilan.getCosmeticTreatments());
            savedBilan.setFichePatient(bilan.getFichePatient());
            // --- Add payment fields ---
            savedBilan.setAmountToPay(bilan.getAmountToPay());
            savedBilan.setAmountPaid(bilan.getAmountPaid());
            savedBilan.setProfit(bilan.getProfit());
            savedBilan.setRemainingToPay(bilan.getRemainingToPay());
            // ... add any other fields you want to update, but NOT documents
        } else {
            savedBilan = bilanMedicalRepository.save(bilan);
            if (savedBilan.getDocuments() == null) {
                savedBilan.setDocuments(new java.util.ArrayList<>());
            }
        }

        if (files != null && !files.isEmpty()) {
            if (savedBilan.getDocuments() == null) {
                savedBilan.setDocuments(new java.util.ArrayList<>());
            }
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        String storedFileName = fileStorageService.storeFile(file, "documents");
                        // Create and save BilanDocument entity
                        BilanDocument document = BilanDocument.builder()
                            .name(file.getOriginalFilename())
                            .filePath(storedFileName)
                            .fileType(file.getContentType())
                            .fileSize(file.getSize())
                            .uploadDate(LocalDateTime.now())
                            .bilanMedical(savedBilan)
                            .build();
                        BilanDocument savedDoc = bilanDocumentRepository.save(document);
                        savedBilan.getDocuments().add(savedDoc);
                        logger.info("Successfully saved document: {} for bilan: {}", 
                            savedDoc.getName(), savedBilan.getId());
                    } catch (Exception e) {
                        logger.error("Error saving document: {}", e.getMessage(), e);
                        throw new RuntimeException("Failed to save document: " + e.getMessage());
                    }
                }
            }
            // Save the bilan again to update the documents collection
            savedBilan = bilanMedicalRepository.save(savedBilan);
        }
        return savedBilan;
    }
} 