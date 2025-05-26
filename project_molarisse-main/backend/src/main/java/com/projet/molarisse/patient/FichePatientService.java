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
        logger.info("Attempting to save FichePatient with ID: {}", fichePatient.getId());
        logger.info("FichePatient allergies: {}", fichePatient.getAllergies());
        logger.info("FichePatient priseMedicaments: {}", fichePatient.getPriseMedicaments());
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
        FichePatient ficheToSave;
        
        // Check if fichePatient object has an ID (indicates update)
        if (fichePatient.getId() != null) {
            // Fetch existing fiche from DB
            Optional<FichePatient> existingFicheOptional = fichePatientRepository.findById(fichePatient.getId());
            if (existingFicheOptional.isPresent()) {
                ficheToSave = existingFicheOptional.get();
                // Update only the allowed fields from the incoming fichePatient object
                logger.info("Existing fichePatient allergies BEFORE update: {}", ficheToSave.getAllergies());
                logger.info("Incoming fichePatient allergies: {}", fichePatient.getAllergies());
                if (fichePatient.getAllergies() != null) {
                    ficheToSave.setAllergies(fichePatient.getAllergies());
                }
                logger.info("Existing fichePatient allergies AFTER update: {}", ficheToSave.getAllergies());

                logger.info("Existing fichePatient priseMedicaments BEFORE update: {}", ficheToSave.getPriseMedicaments());
                logger.info("Incoming fichePatient priseMedicaments: {}", fichePatient.getPriseMedicaments());
                if (fichePatient.getPriseMedicaments() != null) {
                    ficheToSave.setPriseMedicaments(fichePatient.getPriseMedicaments());
                }
                logger.info("Existing fichePatient priseMedicaments AFTER update: {}", ficheToSave.getPriseMedicaments());
                // You might want to update other fields here if necessary, e.g., blood pressure, maladies, toothData
                // Example: ficheToSave.setBloodPressureSystolic(fichePatient.getBloodPressureSystolic());
                logger.info("Updating existing fichePatient with ID: {}", ficheToSave.getId());
            } else {
                // Existing fiche not found, proceed as if creating new but log a warning
                logger.warn("Existing FichePatient with ID {} not found. Creating new.", fichePatient.getId());
                ficheToSave = fichePatient;
                ficheToSave.setPatientId(patientId); // Ensure patientId is set for new fiche
            }
        } else {
            // No ID, so it's a new fichePatient
            logger.info("Creating new FichePatient for patient ID: {}", patientId);
            ficheToSave = fichePatient;
            ficheToSave.setPatientId(patientId);
        }

        // Ensure documents list is initialized for the fiche being saved
        if (ficheToSave.getDocuments() == null) {
            ficheToSave.setDocuments(new ArrayList<>());
        }

        // Save the fiche (either new or updated existing one)
        FichePatient saved = fichePatientRepository.saveAndFlush(ficheToSave);
        
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