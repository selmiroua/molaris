package com.projet.molarisse.patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.projet.molarisse.appointment.AppointmentDocument;
import com.projet.molarisse.appointment.AppointmentDocumentRepository;
import com.projet.molarisse.service.FileStorageService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FichePatientService {
    private static final Logger logger = LoggerFactory.getLogger(FichePatientService.class);

    @Autowired
    private FichePatientRepository fichePatientRepository;
    
    @Autowired
    private AppointmentDocumentRepository documentRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    public FichePatient saveFichePatient(FichePatient fichePatient) {
        return fichePatientRepository.save(fichePatient);
    }

    public Optional<FichePatient> getFichePatient(Integer patientId) {
        return fichePatientRepository.findByPatientId(patientId);
    }

    public boolean existsByPatientId(Integer patientId) {
        return fichePatientRepository.existsByPatientId(patientId);
    }
    
    /**
     * Create or update a patient file with supporting documents
     * @param patientId The ID of the patient
     * @param fichePatient The patient file data
     * @param files The uploaded files
     * @return The saved patient file
     */
    @Transactional
    public FichePatient createOrUpdateFicheWithDocuments(Integer patientId, FichePatient fichePatient, 
                                                        List<MultipartFile> files) {
        // Set patient ID
        fichePatient.setPatientId(patientId);
        
        // Ensure documents list is initialized
        if (fichePatient.getDocuments() == null) {
            fichePatient.setDocuments(new ArrayList<>());
        }
        
        // Save the fiche first and flush to ensure it's in the database
        logger.info("Saving fiche for patient ID: {}", patientId);
        FichePatient saved = fichePatientRepository.saveAndFlush(fichePatient);
        
        // Process any files if provided
        if (files != null && !files.isEmpty()) {
            logger.info("Processing {} files for patient ID {}", files.size(), patientId);
            
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    logger.warn("Skipping empty file");
                    continue;
                }
                
                try {
                    // Store the file
                    String storedFileName = fileStorageService.storeFile(file, "documents");
                    logger.info("Stored file: {} as {}", file.getOriginalFilename(), storedFileName);
                    
                    // Set document fields on the fiche for primary document if not already set
                    if (saved.getDocumentPath() == null) {
                        saved.setDocumentName(file.getOriginalFilename());
                        saved.setDocumentPath(storedFileName);
                        saved.setDocumentType(file.getContentType());
                        saved.setDocumentSize(file.getSize());
                        saved.setDocumentUploadDate(LocalDateTime.now());
                    }
                    
                    // Create and save document entity
                    AppointmentDocument document = AppointmentDocument.builder()
                        .documentType(AppointmentDocument.DocumentType.PATIENT)
                        .name(file.getOriginalFilename())
                        .filePath(storedFileName)
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .uploadDate(LocalDateTime.now())
                        .build();
                    
                    // Set the bidirectional relationship
                    document.setFichePatient(saved);
                    
                    // Save document and add to collection
                    AppointmentDocument savedDoc = documentRepository.save(document);
                    saved.getDocuments().add(savedDoc);
                } catch (Exception e) {
                    logger.error("Error processing file {}: {}", file.getOriginalFilename(), e.getMessage());
                    throw new RuntimeException("Failed to process file: " + file.getOriginalFilename(), e);
                }
            }
            
            // Save the updated fiche with document references
            logger.info("Saving updated fiche with document references");
            saved = fichePatientRepository.save(saved);
        }
        
        return saved;
    }
} 