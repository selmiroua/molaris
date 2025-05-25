package com.projet.molarisse.user;

import com.projet.molarisse.security.JwtService;
import com.projet.molarisse.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import io.jsonwebtoken.Claims;

/**
 * Controller for serving document files like cabinet photos and diploma documents
 */
@RestController
@RequestMapping("/api/users/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class DocumentController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    
    private final FileStorageService fileStorageService;
    private final DoctorVerificationRepository verificationRepository;
    private final JwtService jwtService;
    
    /**
     * Serves a cabinet photo by filename
     */
    @GetMapping("/cabinet_photos/{fileName:.+}")
    public ResponseEntity<Resource> getCabinetPhoto(
            @PathVariable String fileName,
            @RequestParam(required = false) String token,
            HttpServletRequest request) {
        logger.debug("Request for cabinet photo: {}", fileName);
        logger.debug("Token received: {}", token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null");
        
        // Check if we have a valid authentication or token
        if (!isAuthenticated(token, request)) {
            logger.error("Authentication failed for cabinet photo request");
            return ResponseEntity.status(403).build();
        }
        
        try {
            // Load file as resource
            Resource resource = fileStorageService.loadFileAsResource("cabinet_photos/" + fileName);
            
            // Determine content type
            String contentType = determineContentType(resource);
            logger.debug("Determined content type for cabinet photo {}: {}", fileName, contentType);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            // Set inline disposition with filename
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"");
            
            // Add Access-Control-* headers to fix CORS issues
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            headers.add("Access-Control-Expose-Headers", "Content-Disposition");
            
            // Return the file
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error serving cabinet photo: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Serves a diploma document by filename
     */
    @GetMapping("/diploma_docs/{fileName:.+}")
    public ResponseEntity<Resource> getDiplomaDocument(
            @PathVariable String fileName,
            @RequestParam(required = false) String token,
            HttpServletRequest request) {
        logger.debug("Request for diploma document: {}", fileName);
        logger.debug("Token received: {}", token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null");
        
        // Check if we have a valid authentication or token
        if (!isAuthenticated(token, request)) {
            logger.error("Authentication failed for diploma document request");
            return ResponseEntity.status(403).build();
        }
        
        try {
            // Load file as resource
            Resource resource = fileStorageService.loadFileAsResource("diploma_docs/" + fileName);
            
            // Determine content type
            String contentType = determineContentType(resource);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            // Set up specific headers for PDFs
            if (fileName.toLowerCase().endsWith(".pdf")) {
                logger.debug("Serving PDF file with content type: {}", contentType);
                
                // Use 'attachment' instead of 'inline' for PDFs
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"");
                
                // Add cache control headers
                headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
                headers.add(HttpHeaders.PRAGMA, "no-cache");
                headers.add(HttpHeaders.EXPIRES, "0");
                
                // Add Content-Length header if possible
                try {
                    headers.setContentLength(resource.contentLength());
                } catch (IOException e) {
                    logger.warn("Could not determine content length: {}", e.getMessage());
                }
                
                // Cross-origin headers
                headers.add("Access-Control-Allow-Origin", "*");
                headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
                headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
                headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
            } else {
                // For images and other files
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"");
            }
            
            // Return the file
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error serving diploma document: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * General endpoint for serving any document with path parameter
     */
    @GetMapping
    public ResponseEntity<Resource> getDocument(
            @RequestParam String path,
            @RequestParam(required = false) String token,
            HttpServletRequest request) {
        logger.debug("Request for document with path: {}", path);
        logger.debug("Token received: {}", token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null");
        
        // Check if we have a valid authentication or token
        if (!isAuthenticated(token, request)) {
            logger.error("Authentication failed for document request");
            return ResponseEntity.status(403).build();
        }
        
        try {
            // Load file as resource
            Resource resource = fileStorageService.loadFileAsResource(path);
            String fileName = resource.getFilename();
            
            // Determine content type
            String contentType = determineContentType(resource);
            logger.debug("Determined content type for {}: {}", fileName, contentType);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            // Set up specific headers for PDFs
            if (fileName != null && fileName.toLowerCase().endsWith(".pdf")) {
                logger.debug("Serving PDF file with content type: {}", contentType);
                
                // Use 'attachment' instead of 'inline' for PDFs
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
                
                // Add cache control headers
                headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
                headers.add(HttpHeaders.PRAGMA, "no-cache");
                headers.add(HttpHeaders.EXPIRES, "0");
                
                // Add Content-Length header if possible
                try {
                    headers.setContentLength(resource.contentLength());
                } catch (IOException e) {
                    logger.warn("Could not determine content length: {}", e.getMessage());
                }
                
                // Cross-origin headers
                headers.add("Access-Control-Allow-Origin", "*");
                headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
                headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
                headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
            } else {
                // For images and other files
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            }
            
            // Return the file
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error serving document: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Determine the content type of a file
     */
    private String determineContentType(Resource resource) {
        try {
            // Try to determine the content type from the file
            Path path = resource.getFile().toPath();
            String fileName = resource.getFilename().toLowerCase();
            
            // Explicit handling for common file types
            if (fileName.endsWith(".pdf")) {
                return "application/pdf";
            } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
                return "image/jpeg";
            } else if (fileName.endsWith(".png")) {
                return "image/png";
            } else if (fileName.endsWith(".gif")) {
                return "image/gif";
            }
            
            // For other files, try to probe content type
            String contentType = Files.probeContentType(path);
            if (contentType != null) {
                return contentType;
            }
            
            // Default to octet-stream if we can't determine the type
            return "application/octet-stream";
        } catch (IOException e) {
            // Default to octet-stream if we can't determine the type
            logger.warn("Could not determine content type: {}", e.getMessage());
            return "application/octet-stream";
        }
    }
    
    /**
     * Check if the request is authenticated either through Spring Security or JWT token
     */
    private boolean isAuthenticated(String token, HttpServletRequest request) {
        try {
            // First, check if there's a valid token provided as a query parameter
            if (token != null && !token.isEmpty()) {
                logger.debug("Processing request for path: {}", request.getServletPath());
                logger.debug("Validating token from query parameter");
                try {
                    // Extract all claims to validate the token
                    Claims claims = jwtService.extractAllClaims(token);
                    if (claims != null && claims.getSubject() != null) {
                        // Token is valid if we can extract the subject (username)
                        logger.debug("Token is valid for user: {}", claims.getSubject());
                        return true;
                    }
                } catch (Exception e) {
                    logger.debug("Error validating token: {}", e.getMessage());
                }
            }
            
            // If query parameter token is not valid, check if the user is authenticated through Spring Security
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAuthenticated = authentication != null && 
                                     authentication.isAuthenticated() && 
                                     !authentication.getPrincipal().equals("anonymousUser");
                                     
            if (isAuthenticated) {
                logger.debug("User is authenticated through Spring Security: {}", authentication.getName());
                return true;
            } else {
                logger.debug("User is not authenticated through Spring Security");
                return false;
            }
        } catch (Exception e) {
            logger.error("Error checking authentication: {}", e.getMessage(), e);
            return false;
        }
    }
} 