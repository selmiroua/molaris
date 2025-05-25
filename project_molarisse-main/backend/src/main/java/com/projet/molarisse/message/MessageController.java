package com.projet.molarisse.message;

import com.projet.molarisse.message.dto.ConversationDTO;
import com.projet.molarisse.message.dto.MessageDTO;
import com.projet.molarisse.message.dto.SendMessageRequest;
import com.projet.molarisse.security.JwtService;
import com.projet.molarisse.user.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
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
    private static final String MEDIA_UPLOAD_DIR = "uploads/messages";
    
    private final MessageService messageService;
    private final MessageMapper messageMapper;
    
    @PostConstruct
    public void init() {
        // Ensure the upload directory exists when the application starts
        try {
            Path uploadDir = Paths.get(MEDIA_UPLOAD_DIR);
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
            Path uploadDir = Paths.get(MEDIA_UPLOAD_DIR);
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
            
            // Set media path to be saved in the database
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
    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<byte[]> getMedia(@PathVariable String filename) throws IOException {
        Path filePath = Paths.get(MEDIA_UPLOAD_DIR).resolve(filename);
        
        if (!Files.exists(filePath)) {
            logger.error("Media file not found: {}", filePath.toAbsolutePath());
            return ResponseEntity.notFound().build();
        }
        
        byte[] media = Files.readAllBytes(filePath);
        logger.info("Serving media file: {}, size: {} bytes", filename, media.length);
        
        String contentType;
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (filename.endsWith(".png")) {
            contentType = "image/png";
        } else if (filename.endsWith(".gif")) {
            contentType = "image/gif";
        } else if (filename.endsWith(".mp3")) {
            contentType = "audio/mpeg";
        } else if (filename.endsWith(".wav")) {
            contentType = "audio/wav";
        } else if (filename.endsWith(".webm")) {
            contentType = "audio/webm";
        } else {
            contentType = "application/octet-stream";
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .header("Cache-Control", "max-age=86400")
                .body(media);
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
     * Get count of unread messages
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadMessageCount(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer currentUserId = currentUser.getId();
        
        logger.info("Fetching unread message count for user {}", currentUserId);
        
        Long unreadCount = messageService.getUnreadMessageCount(currentUserId);
        
        return ResponseEntity.ok(unreadCount);
    }
} 