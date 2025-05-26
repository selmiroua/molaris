package com.projet.molarisse.patient;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.UserService;
import com.projet.molarisse.user.User;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.ArrayList;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import com.projet.molarisse.appointment.AppointmentDocument;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.nio.file.StandardCopyOption;
import org.springframework.transaction.annotation.Transactional;
import com.projet.molarisse.appointment.AppointmentDocumentRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import com.projet.molarisse.service.FileStorageService;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", 
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
    allowCredentials = "true",
    maxAge = 3600)
public class PatientController {
    private static final Logger logger = LoggerFactory.getLogger(PatientController.class);
    private final FichePatientRepository fichePatientRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final AppointmentDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final FichePatientService fichePatientService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentPatient(Authentication authentication) {
        logger.info("Fetching current patient information");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            logger.info("Found current patient with ID: {}", currentUser.getId());
            return ResponseEntity.ok(currentUser);
        } catch (Exception e) {
            logger.error("Error fetching current patient: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching patient information");
        }
    }

    @GetMapping("/me/fiche")
    public ResponseEntity<?> getCurrentPatientFiche(Authentication authentication) {
        logger.info("Fetching fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            
            if (fichePatient.isPresent()) {
                logger.info("Found fiche for current patient");
                return ResponseEntity.ok(fichePatient.get());
            } else {
                logger.warn("No fiche found for current patient");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching current patient fiche: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching patient fiche");
        }
    }

    @PostMapping("/me/fiche")
    @Transactional
    public ResponseEntity<?> createOrUpdateCurrentPatientFiche(
            @RequestBody FichePatient fichePatient,
            Authentication authentication) {
        logger.info("Creating/Updating fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            fichePatient.setPatientId(currentUser.getId());
            
            // Save the fiche patient
            FichePatient savedFiche = fichePatientRepository.save(fichePatient);
            logger.info("Successfully saved fiche patient with ID: {}", savedFiche.getId());
            
            return ResponseEntity.ok(savedFiche);
        } catch (Exception e) {
            logger.error("Error in createOrUpdateCurrentPatientFiche: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error saving patient fiche: " + e.getMessage());
        }
    }

    @PutMapping("/me/fiche")
    public ResponseEntity<?> updateCurrentPatientFiche(
            @RequestBody FichePatient fichePatient,
            Authentication authentication) {
        logger.info("Updating fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            return fichePatientRepository.findByPatientId(currentUser.getId())
                    .map(existing -> {
                        fichePatient.setId(existing.getId());
                        fichePatient.setPatientId(currentUser.getId());
                        FichePatient updated = fichePatientRepository.save(fichePatient);
                        logger.info("Successfully updated fiche for current patient");
                        return ResponseEntity.ok(updated);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating current patient fiche: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error updating patient fiche");
        }
    }

    @GetMapping("/{patientId}/fiche")
    public ResponseEntity<?> getFichePatient(@PathVariable Integer patientId) {
        logger.info("Fetching fiche for patient ID: {}", patientId);
        
        var fichePatient = fichePatientRepository.findByPatientId(patientId);
        
        if (fichePatient.isPresent()) {
            logger.info("Found fiche for patient ID: {}", patientId);
            return ResponseEntity.ok(fichePatient.get());
        } else {
            logger.warn("No fiche found for patient ID: {}", patientId);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{patientId}/fiche")
    public ResponseEntity<?> createOrUpdateFichePatient(
            @PathVariable Integer patientId,
            @RequestBody FichePatient fichePatient) {
        logger.info("Creating/Updating fiche for patient ID {} using service.", patientId);
        
        try {
            // Delegate to service for handling create or update logic
            FichePatient saved = fichePatientService.createOrUpdateFicheWithDocuments(patientId, fichePatient, null);
            logger.info("Successfully processed fiche update/create for patient ID: {}", patientId);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error in createOrUpdateFichePatient controller: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error processing patient fiche: " + e.getMessage()));
        }
    }

    @PostMapping("/{patientId}/fiche/with-documents")
    public ResponseEntity<?> createOrUpdateFichePatientWithDocuments(
            @PathVariable Integer patientId,
            @RequestPart("fichePatient") FichePatient fichePatient,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        logger.info("Received request to create/update fiche with documents for patient ID: {}", patientId);
        
        try {
            // Delegate to service for transaction management
            FichePatient saved = fichePatientService.createOrUpdateFicheWithDocuments(patientId, fichePatient, files);
            logger.info("Successfully created/updated fiche with documents for patient ID: {}", patientId);
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating/updating fiche with documents: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error processing fiche with documents: " + e.getMessage()));
        }
    }

    @PutMapping("/{patientId}/fiche")
    public ResponseEntity<?> updateFichePatient(
            @PathVariable Integer patientId,
            @RequestBody FichePatient fichePatient) {
        logger.info("Updating fiche for patient ID: {}", patientId);
        
        return fichePatientRepository.findByPatientId(patientId)
                .map(existing -> {
                    fichePatient.setId(existing.getId());
                    fichePatient.setPatientId(patientId);
                    FichePatient updated = fichePatientRepository.save(fichePatient);
                    logger.info("Successfully updated fiche for patient ID: {}", patientId);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/fiche/document")
    public ResponseEntity<?> getCurrentPatientDocument(Authentication authentication) {
        logger.info("Fetching document for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            logger.info("Current user ID: {}", currentUser.getId());
            
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            logger.info("Fiche patient found: {}", fichePatient.isPresent());
            
            if (fichePatient.isPresent()) {
                FichePatient fiche = fichePatient.get();
                logger.info("Fiche details - ID: {}, Patient ID: {}", fiche.getId(), fiche.getPatientId());
                
                // Check if document exists in fiche
                if (fiche.getDocumentPath() == null) {
                    logger.warn("No document path found in fiche");
                    return ResponseEntity.notFound().build();
                }
                
                logger.info("Document details - Path: {}, Name: {}, Type: {}, Size: {}, Upload Date: {}", 
                    fiche.getDocumentPath(),
                    fiche.getDocumentName(),
                    fiche.getDocumentType(),
                    fiche.getDocumentSize(),
                    fiche.getDocumentUploadDate());
                
                try {
                    String documentPath = fiche.getDocumentPath();
                    logger.info("Attempting to load document from path: {}", documentPath);
                    
                    // Log the full file path
                    Path fullPath = Paths.get(uploadDir).resolve(documentPath);
                    logger.info("Full file path: {}", fullPath.toAbsolutePath());
                    
                    // Check if file exists
                    if (!Files.exists(fullPath)) {
                        logger.error("File does not exist at path: {}", fullPath);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Document file not found"));
                    }
                    
                    Resource resource = fileStorageService.loadFileAsResource(documentPath);
                    logger.info("Successfully loaded document resource");
                    
                    // Determine content type
                    String contentType = fiche.getDocumentType();
                    if (contentType == null || contentType.isEmpty()) {
                        contentType = "application/octet-stream";
                        logger.warn("Content type not set, using default: {}", contentType);
                    }
                    
                    // Set filename
                    String filename = fiche.getDocumentName();
                    if (filename == null || filename.isEmpty()) {
                        filename = "document";
                        logger.warn("Filename not set, using default: {}", filename);
                    }
                    
                    logger.info("Sending document response - Content-Type: {}, Filename: {}", contentType, filename);
                    
                    return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                        .header(HttpHeaders.PRAGMA, "no-cache")
                        .header(HttpHeaders.EXPIRES, "0")
                        .body(resource);
                } catch (Exception e) {
                    logger.error("Error loading document: {}", e.getMessage(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "Error loading document: " + e.getMessage()));
                }
            }
            
            logger.warn("No fiche found for patient ID: {}", currentUser.getId());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error retrieving document: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Error retrieving document: " + e.getMessage()));
        }
    }

    @GetMapping("/me/fiche/document/download")
    public ResponseEntity<Resource> downloadDocument(Authentication authentication) {
        try {
            User currentUser = userService.getCurrentUser(authentication);
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            
            if (fichePatient.isPresent() && fichePatient.get().getDocumentPath() != null) {
                FichePatient fiche = fichePatient.get();
                // Use the stored path directly
                Path filePath = Paths.get(uploadDir).resolve(fiche.getDocumentPath());
                
                if (!Files.exists(filePath)) {
                    logger.error("Document file not found: {}", filePath);
                    return ResponseEntity.notFound().build();
                }
                
                Resource resource = new UrlResource(filePath.toUri());
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fiche.getDocumentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fiche.getDocumentName() + "\"")
                    .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error downloading document: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/me/fiche/document")
    @Transactional
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        logger.info("Starting document upload process");
        try {
            if (file.isEmpty()) {
                logger.error("Failed to upload empty file");
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }

            User currentUser = userService.getCurrentUser(authentication);
            var ficheOpt = fichePatientRepository.findByPatientId(currentUser.getId());
            FichePatient fiche;
            if (ficheOpt.isEmpty()) {
                fiche = new FichePatient();
                fiche.setPatientId(currentUser.getId());
                fiche.setNom(currentUser.getNom());
                fiche.setPrenom(currentUser.getPrenom());
            } else {
                fiche = ficheOpt.get();
            }

            // Store the file
            String storedFileName = fileStorageService.storeFile(file, "documents");

            // Set document fields
            fiche.setDocumentName(file.getOriginalFilename());
            fiche.setDocumentPath(storedFileName);
            fiche.setDocumentType(file.getContentType());
            fiche.setDocumentSize(file.getSize());
            fiche.setDocumentUploadDate(LocalDateTime.now());

            // Save fiche
            fiche = fichePatientRepository.save(fiche);

            // Also create and save AppointmentDocument
            AppointmentDocument document = AppointmentDocument.builder()
                .documentType(AppointmentDocument.DocumentType.PATIENT)
                .name(file.getOriginalFilename())
                .filePath(storedFileName)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .uploadDate(LocalDateTime.now())
                .fichePatient(fiche)
                .build();
            document = documentRepository.save(document);

            // Add to fiche's documents list and save again
            fiche.getDocuments().add(document);
            fichePatientRepository.save(fiche);

            logger.info("Successfully completed document upload process");
            return ResponseEntity.ok(fiche);
        } catch (Exception e) {
            logger.error("Error in document upload process: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading document: " + e.getMessage());
        }
    }
}