package com.projet.molarisse.service;

import com.projet.molarisse.config.FileStorageConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private final Path fileStorageLocation;

    @Autowired
    public FileStorageService(FileStorageConfig fileStorageConfig) {
        this.fileStorageLocation = Paths.get(fileStorageConfig.getUploadDir())
                .toAbsolutePath().normalize();
        logger.info("Initializing FileStorageService with upload directory: {}", this.fileStorageLocation);

        try {
            // Create main upload directory
            if (!Files.exists(this.fileStorageLocation)) {
                Files.createDirectories(this.fileStorageLocation);
                logger.info("Created main upload directory: {}", this.fileStorageLocation);
            }
            
            // Create default subdirectories
            createSubdirectory("documents");
            createSubdirectory("profile-pictures");
            createSubdirectory("cvs");
            
            // Log directory structure
            logger.info("Directory structure:");
            Files.walk(this.fileStorageLocation, 1)
                .forEach(path -> logger.info("  - {}", path));
        } catch (IOException ex) {
            logger.error("Could not create the directory where the uploaded files will be stored: {}", ex.getMessage(), ex);
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    private void createSubdirectory(String subDir) throws IOException {
        Path subDirPath = this.fileStorageLocation.resolve(subDir);
        if (!Files.exists(subDirPath)) {
            Files.createDirectories(subDirPath);
            logger.info("Created subdirectory: {}", subDirPath);
        }
    }

    /**
     * Stocke le fichier dans le répertoire racine de stockage
     */
    public String storeFile(MultipartFile file) {
        return storeFile(file, null);
    }

    /**
     * Stocke le fichier dans un sous-répertoire spécifique
     * @param file Le fichier à stocker
     * @param subDirectory Le sous-répertoire (null pour le répertoire racine)
     * @return Le nom du fichier stocké
     */
    public String storeFile(MultipartFile file, String subDirectory) {
        logger.info("Storing file with subdirectory: {}", subDirectory);
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        logger.info("Original filename: {}", originalFileName);
        
        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                logger.error("Invalid filename: {}", originalFileName);
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }

            // Generate unique filename
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String newFileName = UUID.randomUUID().toString() + fileExtension;
            logger.info("Generated new filename: {}", newFileName);

            // Create subdirectory if needed
            Path targetLocation;
            if (subDirectory != null && !subDirectory.isEmpty()) {
                Path subDirectoryPath = this.fileStorageLocation.resolve(subDirectory);
                logger.info("Using subdirectory path: {}", subDirectoryPath);
                
                // Ensure subdirectory exists
                if (!Files.exists(subDirectoryPath)) {
                    logger.info("Creating subdirectory: {}", subDirectoryPath);
                    Files.createDirectories(subDirectoryPath);
                }
                
                targetLocation = subDirectoryPath.resolve(newFileName);
                newFileName = subDirectory + "/" + newFileName;
                logger.info("Final file path: {}", newFileName);
            } else {
                targetLocation = this.fileStorageLocation.resolve(newFileName);
            }

            // Ensure parent directory exists
            Files.createDirectories(targetLocation.getParent());
            
            logger.info("Copying file to: {}", targetLocation);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("File successfully stored at: {}", targetLocation);

            // Verify file was created
            if (Files.exists(targetLocation)) {
                logger.info("File exists after copy: {}", targetLocation);
                logger.info("File size: {} bytes", Files.size(targetLocation));
            } else {
                logger.error("File was not created: {}", targetLocation);
                throw new RuntimeException("File was not created successfully");
            }

            return newFileName;
        } catch (IOException ex) {
            logger.error("Could not store file {}: {}", originalFileName, ex.getMessage(), ex);
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        logger.info("Attempting to load file: {}", fileName);
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            logger.info("Resolved file path: {}", filePath.toAbsolutePath());
            
            // Check if the file exists
            if (!Files.exists(filePath)) {
                logger.error("File not found: {}", filePath.toAbsolutePath());
                
                // Check if the directory exists
                Path parentDir = filePath.getParent();
                if (Files.exists(parentDir)) {
                    logger.info("Directory exists: {}", parentDir);
                    logger.info("Files in directory:");
                    Files.list(parentDir).forEach(file -> logger.info("  - {}", file.getFileName()));
                } else {
                    logger.error("Directory does not exist: {}", parentDir);
                }
                
                throw new RuntimeException("File not found " + fileName);
            }
            
            // Check if the file is readable
            if (!Files.isReadable(filePath)) {
                logger.error("File is not readable: {}", filePath.toAbsolutePath());
                throw new RuntimeException("File is not readable " + fileName);
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if(resource.exists() && resource.isReadable()) {
                logger.info("File found and readable: {}", filePath.toAbsolutePath());
                return resource;
            } else {
                logger.error("File exists but is not readable as a resource: {}", filePath.toAbsolutePath());
                throw new RuntimeException("File not readable as resource " + fileName);
            }
        } catch (MalformedURLException ex) {
            logger.error("Malformed URL: {}", ex.getMessage(), ex);
            throw new RuntimeException("File not found " + fileName, ex);
        } catch (IOException ex) {
            logger.error("IO Exception: {}", ex.getMessage(), ex);
            throw new RuntimeException("IO error accessing file " + fileName, ex);
        }
    }

    public void deleteFile(String fileName) {
        logger.info("Attempting to delete file: {}", fileName);
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            logger.info("Resolved file path for deletion: {}", filePath);
            Files.deleteIfExists(filePath);
            logger.info("File deleted successfully");
        } catch (IOException ex) {
            logger.error("Could not delete file {}: {}", fileName, ex.getMessage(), ex);
            throw new RuntimeException("Could not delete file " + fileName, ex);
        }
    }
}
