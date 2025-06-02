package com.projet.molarisse.message;

import com.projet.molarisse.message.dto.ConversationDTO;
import com.projet.molarisse.message.dto.MessageDTO;
import com.projet.molarisse.message.dto.SendMessageRequest;
import com.projet.molarisse.security.JwtService;
import com.projet.molarisse.service.FileStorageService;
import com.projet.molarisse.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);
    @Value("${file.upload-dir}")
    private String uploadDirRoot;
    private static final String MEDIA_SUBDIR = "messages";
    
    private final MessageService messageService;
    private final MessageMapper messageMapper;
    private final FileStorageService fileStorageService;
    
    @PostConstruct
    public void init() {
        // Ensure the upload directory exists when the application starts
        try {
            Path uploadDir = Paths.get(uploadDirRoot, MEDIA_SUBDIR);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                logger.info("Created media upload directory: {}", uploadDir.toAbsolutePath());
            } else {
                logger.info("Media upload directory exists: {}", uploadDir.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("Failed to create media upload directory: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send a message to another user
     */
    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer senderId = currentUser.getId();
        
        logger.info("User {} is sending message to user {}", senderId, request.getRecipientId());
        
        Message message = messageService.sendMessage(
                senderId,
                request.getRecipientId(),
                request.getContent(),
                request.getMediaType(),
                request.getMediaPath());
        
        return ResponseEntity.ok(messageMapper.toDTO(message, senderId));
    }
    
    /**
     * Send a message with media attachment
     */
    @PostMapping("/with-media")
    public ResponseEntity<MessageDTO> sendMessageWithMedia(
            @RequestParam("recipientId") Integer recipientId,
            @RequestParam("content") String content,
            @RequestParam("mediaType") String mediaType,
            @RequestParam(value = "media", required = false) MultipartFile mediaFile,
            Authentication authentication) throws IOException {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer senderId = currentUser.getId();
        
        logger.info("User {} is sending message with media to user {}, media type: {}", 
                senderId, recipientId, mediaType);
        
        String mediaPath = null;
        
        if (mediaFile != null && !mediaFile.isEmpty()) {
            // Ensure upload directory exists
            Path uploadDir = Paths.get(uploadDirRoot, MEDIA_SUBDIR);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                logger.info("Created media upload directory: {}", uploadDir.toAbsolutePath());
            }
            
            // Generate unique filename
            String originalFilename = mediaFile.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : mediaType.equals("VOICE") ? ".mp3" : ".bin";
            
            String filename = UUID.randomUUID().toString() + fileExtension;
            
            // Save file
            Path filePath = uploadDir.resolve(filename);
            Files.copy(mediaFile.getInputStream(), filePath);
            
            // Set media path to be saved in the database (just the filename)
            mediaPath = filename;
            
            logger.info("Saved media file: {}, size: {} bytes, path: {}", 
                    mediaPath, mediaFile.getSize(), filePath.toAbsolutePath());
        }
        
        Message message = messageService.sendMessage(
                senderId,
                recipientId,
                content,
                mediaType,
                mediaPath);
        
        return ResponseEntity.ok(messageMapper.toDTO(message, senderId));
    }
    
    /**
     * Get media file
     */
    @GetMapping("/media/{fileName:.+}")
    public ResponseEntity<Resource> getMessageMedia(@PathVariable String fileName) {
        try {
            logger.info("Requested message media: {}", fileName);
            
            // Handle case where fileName might contain "messages/" prefix
            String actualFileName = fileName;
            if (fileName.startsWith("messages/")) {
                // Remove the redundant prefix
                actualFileName = fileName.substring("messages/".length());
                logger.info("Removed redundant 'messages/' prefix, actual filename: {}", actualFileName);
            }
            
            // Always serve from the messages subdirectory
            String fullFileName = MEDIA_SUBDIR + "/" + actualFileName;
            logger.info("Looking for file at path: {}", fullFileName);
            
            Resource resource = fileStorageService.loadFileAsResource(fullFileName);
            
            // Determine content type
            MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
            String lowerFileName = actualFileName.toLowerCase();
            if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) {
                contentType = MediaType.IMAGE_JPEG;
            } else if (lowerFileName.endsWith(".png")) {
                contentType = MediaType.IMAGE_PNG;
            } else if (lowerFileName.endsWith(".gif")) {
                contentType = MediaType.IMAGE_GIF;
            } else if (lowerFileName.endsWith(".mp3")) {
                contentType = MediaType.parseMediaType("audio/mpeg");
            } else if (lowerFileName.endsWith(".wav")) {
                contentType = MediaType.parseMediaType("audio/wav");
            } else if (lowerFileName.endsWith(".webm")) {
                contentType = MediaType.parseMediaType("audio/webm");
            }
            
            return ResponseEntity.ok()
                        .contentType(contentType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000") // Cache for 1 year
                        .body(resource);
        } catch (Exception e) {
            logger.error("Error loading message media '{}': {}", fileName, e.getMessage(), e);
            
            // Check if it's a file not found exception
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get conversation with another user
     */
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<MessageDTO>> getConversation(
            @PathVariable Integer userId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Fetching conversation between users {} and {}", currentUserId, userId);
        
        List<Message> messages = messageService.getConversation(currentUserId, userId);
        List<MessageDTO> messageDTOs = messages.stream()
                .map(message -> messageMapper.toDTO(message, currentUserId))
                .collect(Collectors.toList());
        
        // Mark all messages from the other user as read
        messageService.markConversationAsRead(currentUserId, userId);
        
        return ResponseEntity.ok(messageDTOs);
    }
    
    /**
     * Get paginated conversation with another user
     */
    @GetMapping("/conversations/{userId}/paged")
    public ResponseEntity<Page<MessageDTO>> getConversationPaged(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Fetching paginated conversation between users {} and {}", currentUserId, userId);
        
        Page<Message> messages = messageService.getConversationPaged(currentUserId, userId, page, size);
        Page<MessageDTO> messageDTOs = messages.map(message -> messageMapper.toDTO(message, currentUserId));
        
        // Mark all messages from the other user as read
        messageService.markConversationAsRead(currentUserId, userId);
        
        return ResponseEntity.ok(messageDTOs);
    }
    
    /**
     * Get all conversations for the current user
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Fetching all conversations for user {}", currentUserId);
        
        List<Map<String, Object>> conversations = messageService.getConversations(currentUserId);
        List<ConversationDTO> conversationDTOs = conversations.stream()
                .map(conversationData -> messageMapper.toConversationDTO(conversationData, currentUserId))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(conversationDTOs);
    }
    
    /**
     * Mark a message as read
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<MessageDTO> markAsRead(
            @PathVariable Integer messageId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Marking message {} as read for user {}", messageId, currentUserId);
        
        Message message = messageService.markAsRead(messageId, currentUserId);
        
        return ResponseEntity.ok(messageMapper.toDTO(message, currentUserId));
    }
    
    /**
     * Mark all messages in a conversation as read
     */
    @PutMapping("/conversations/{userId}/read")
    public ResponseEntity<?> markConversationAsRead(
            @PathVariable Integer userId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Marking all messages from user {} to user {} as read", userId, currentUserId);
        
        messageService.markConversationAsRead(currentUserId, userId);
        
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get unread message count for the current user
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadMessageCount(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Getting unread message count for user {}", currentUserId);
        
        Long unreadCount = messageService.getUnreadMessageCount(currentUserId);
        return ResponseEntity.ok(unreadCount);
    }
    
    /**
     * Delete a message
     * Only the sender can delete their own message
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Integer messageId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("User {} is attempting to delete message {}", currentUserId, messageId);
        
        try {
            messageService.deleteMessage(messageId, currentUserId);
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Message deleted successfully"
            ));
        } catch (EntityNotFoundException e) {
            logger.error("Message not found: {}", e.getMessage());
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            logger.error("Unauthorized delete attempt: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error deleting message: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "An error occurred while deleting the message"
            ));
        }
    }
    
    /**
     * Edit a message
     * Only the sender can edit their own message
     */
    @PutMapping("/{messageId}")
    public ResponseEntity<?> editMessage(
            @PathVariable Integer messageId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        // Extract the new content from the request body
        String newContent = payload.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Content cannot be empty"
            ));
        }
        
        logger.info("User {} is attempting to edit message {}", currentUserId, messageId);
        
        try {
            Message updatedMessage = messageService.editMessage(messageId, currentUserId, newContent);
            return ResponseEntity.ok(messageMapper.toDTO(updatedMessage, currentUserId));
        } catch (EntityNotFoundException e) {
            logger.error("Message not found: {}", e.getMessage());
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            logger.error("Unauthorized edit attempt: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error editing message: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "An error occurred while editing the message"
            ));
        }
    }
    
    /**
     * Additional endpoint to match the frontend URL pattern
     * This ensures we can handle /api/v1/api/messages/media paths
     */
    @GetMapping("/media/**")
    public ResponseEntity<Resource> getMessageMediaWithAnyPath(HttpServletRequest request) {
        try {
            // Extract the file name from the path
            String requestPath = request.getRequestURI();
            logger.info("Requested message media with path: {}", requestPath);
            
            // Extract just the filename from the full path
            String fileName = requestPath;
            
            // Handle paths with different prefixes
            if (fileName.contains("/media/")) {
                fileName = fileName.substring(fileName.lastIndexOf("/media/") + "/media/".length());
            }
            
            // Handle case where fileName might still contain "messages/" prefix
            if (fileName.startsWith("messages/")) {
                fileName = fileName.substring("messages/".length());
            }
            
            logger.info("Extracted filename: {}", fileName);
            
            // Always serve from the messages subdirectory
            String fullFileName = MEDIA_SUBDIR + "/" + fileName;
            logger.info("Looking for file at path: {}", fullFileName);
            
            Resource resource = fileStorageService.loadFileAsResource(fullFileName);
            
            // Determine content type
            MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
            String lowerFileName = fileName.toLowerCase();
            if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) {
                contentType = MediaType.IMAGE_JPEG;
            } else if (lowerFileName.endsWith(".png")) {
                contentType = MediaType.IMAGE_PNG;
            } else if (lowerFileName.endsWith(".gif")) {
                contentType = MediaType.IMAGE_GIF;
            } else if (lowerFileName.endsWith(".mp3")) {
                contentType = MediaType.parseMediaType("audio/mpeg");
            } else if (lowerFileName.endsWith(".wav")) {
                contentType = MediaType.parseMediaType("audio/wav");
            } else if (lowerFileName.endsWith(".webm")) {
                contentType = MediaType.parseMediaType("audio/webm");
            }
            
            return ResponseEntity.ok()
                      .contentType(contentType)
                      .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                      .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000") // Cache for 1 year
                      .body(resource);
        } catch (Exception e) {
            logger.error("Error loading media with path from request: {}", e.getMessage(), e);
            
            // Check if it's a file not found exception
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 