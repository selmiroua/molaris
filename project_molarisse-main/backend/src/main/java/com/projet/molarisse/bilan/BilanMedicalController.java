package com.projet.molarisse.bilan;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import org.springframework.web.multipart.MultipartFile;
import com.projet.molarisse.service.FileStorageService;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.ArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/bilans")
public class BilanMedicalController {
    private static final Logger logger = LoggerFactory.getLogger(BilanMedicalController.class);

    @Autowired
    private BilanMedicalService bilanMedicalService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private BilanDocumentRepository bilanDocumentRepository;

    @PostMapping
    public ResponseEntity<BilanMedical> createBilan(
        @RequestPart("bilan") BilanMedical bilan,
        @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        try {
            BilanMedical saved = bilanMedicalService.saveBilanWithDocuments(bilan, files);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating bilan: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BilanMedical> updateBilan(
        @PathVariable Integer id,
        @RequestPart("bilan") BilanMedical bilan,
        @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        try {
            bilan.setId(id);
            BilanMedical saved = bilanMedicalService.saveBilanWithDocuments(bilan, files);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error updating bilan: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<BilanMedical> getBilan(@PathVariable Integer id) {
        Optional<BilanMedical> bilan = bilanMedicalService.getBilan(id);
        return bilan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<BilanMedical>> getAllBilans() {
        return ResponseEntity.ok(bilanMedicalService.getAllBilans());
    }

    @GetMapping("/fichePatient/{fichePatientId}")
    public ResponseEntity<BilanMedical> getBilanByFichePatientId(@PathVariable Integer fichePatientId) {
        System.out.println("BilanMedicalController: Received GET /api/bilans/fichePatient/" + fichePatientId);
        Optional<BilanMedical> bilan = bilanMedicalService.getBilanByFichePatientId(fichePatientId);
        if (bilan.isPresent()) {
            System.out.println("BilanMedicalController: Found BilanMedical for fichePatientId " + fichePatientId);
            return ResponseEntity.ok(bilan.get());
        } else {
            System.out.println("BilanMedicalController: No BilanMedical found for fichePatientId " + fichePatientId);
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBilan(@PathVariable Integer id) {
        bilanMedicalService.deleteBilan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bilanId}/document")
    public ResponseEntity<?> uploadDocumentToBilan(
            @PathVariable Integer bilanId,
            @RequestParam("files") MultipartFile[] files) {
        try {
            logger.info("UPLOAD: Received {} files for bilanId={}", 
                files == null ? "null" : files.length, bilanId);

            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest().body("Please select at least one file to upload");
            }

            BilanMedical bilan = bilanMedicalService.getBilan(bilanId)
                .orElseThrow(() -> new RuntimeException("BilanMedical not found"));

            List<BilanDocument> savedDocuments = new ArrayList<>();

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String storedFileName = fileStorageService.storeFile(file, "documents");

                BilanDocument document = BilanDocument.builder()
                    .name(file.getOriginalFilename())
                    .filePath(storedFileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .uploadDate(LocalDateTime.now())
                    .bilanMedical(bilan)
                    .build();

                BilanDocument savedDoc = bilanDocumentRepository.save(document);
                logger.info("UPLOAD: Saved BilanDocument with id={}", savedDoc.getId());
                savedDocuments.add(savedDoc);
            }

            // Update the bilan to include the new documents
            bilan.getDocuments().addAll(savedDocuments);
            bilanMedicalService.saveBilan(bilan);

            logger.info("UPLOAD: Returning {} saved documents.", savedDocuments.size());
            return ResponseEntity.ok(savedDocuments);
        } catch (Exception e) {
            logger.error("Error uploading documents: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading documents: " + e.getMessage());
        }
    }

    @GetMapping("/documents/file")
    public ResponseEntity<Resource> getBilanDocumentFile(
            @RequestParam("path") String filePath,
            HttpServletRequest request) {
        try {
            // Ensure filePath starts with 'documents/'
            if (!filePath.startsWith("documents/")) {
                filePath = "documents/" + filePath;
            }
            logger.info("Attempting to load document file: {}", filePath);
            Resource resource = fileStorageService.loadFileAsResource(filePath);
            logger.info("File loaded successfully: {}", resource.getFilename());
            String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            logger.info("Content type determined: {}", contentType);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"");
            return ResponseEntity.ok().headers(headers).body(resource);
        } catch (Exception e) {
            logger.error("Error retrieving document file: {} - Full error: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{bilanId}/documents")
    public ResponseEntity<List<BilanDocument>> getBilanDocuments(@PathVariable Integer bilanId) {
        try {
            Optional<BilanMedical> bilanOpt = bilanMedicalService.getBilan(bilanId);
            if (bilanOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            BilanMedical bilan = bilanOpt.get();
            return ResponseEntity.ok(bilan.getDocuments());
        } catch (Exception e) {
            logger.error("Error retrieving bilan documents: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/documents/list")
    public ResponseEntity<?> listBilanDocuments() {
        try {
            java.nio.file.Path documentsDir = java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", "documents");
            java.util.List<String> files = new java.util.ArrayList<>();
            if (java.nio.file.Files.exists(documentsDir)) {
                java.nio.file.Files.list(documentsDir).forEach(path -> files.add(path.getFileName().toString()));
            }
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error listing files: " + e.getMessage());
        }
    }

    @DeleteMapping("/{bilanId}/document/{documentId}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable Integer bilanId,
            @PathVariable Integer documentId) {
        try {
            Optional<BilanMedical> bilanOpt = bilanMedicalService.getBilan(bilanId);
            if (bilanOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            BilanMedical bilan = bilanOpt.get();

            Optional<BilanDocument> docOpt = bilan.getDocuments().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst();

            if (docOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BilanDocument doc = docOpt.get();
            bilan.getDocuments().remove(doc);
            bilanDocumentRepository.delete(doc);
            bilanMedicalService.saveBilan(bilan);

            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting document: " + e.getMessage());
        }
    }
} 