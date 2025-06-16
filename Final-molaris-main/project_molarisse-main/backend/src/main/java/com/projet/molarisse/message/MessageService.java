package com.projet.molarisse.message;

import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    
    /**
     * Send a message from one user to another
     */
    @Transactional
    public Message sendMessage(Integer senderId, Integer recipientId, String content) {
        // Validate users exist
        validateUserExists(senderId);
        validateUserExists(recipientId);
        
        Message message = Message.builder()
                .senderId(senderId)
                .recipientId(recipientId)
                .content(content)
                .isRead(false)
                .isEdited(false)
                .sentAt(LocalDateTime.now())
                .build();
        
        Message savedMessage = messageRepository.save(message);
        logger.info("Message sent from user {} to user {}", senderId, recipientId);
        
        return savedMessage;
    }
    
    /**
     * Send a message from one user to another with optional media attachment
     */
    @Transactional
    public Message sendMessage(Integer senderId, Integer recipientId, String content, String mediaType, String mediaPath) {
        // Validate users exist
        validateUserExists(senderId);
        validateUserExists(recipientId);
        
        Message message = Message.builder()
                .senderId(senderId)
                .recipientId(recipientId)
                .content(content)
                .mediaType(mediaType)
                .mediaPath(mediaPath)
                .isRead(false)
                .isEdited(false)
                .sentAt(LocalDateTime.now())
                .build();
        
        Message savedMessage = messageRepository.save(message);
        logger.info("Message sent from user {} to user {} with media type: {}", senderId, recipientId, mediaType);
        
        return savedMessage;
    }
    
    /**
     * Get all messages between two users
     */
    @Transactional(readOnly = true)
    public List<Message> getConversation(Integer userId1, Integer userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }
    
    /**
     * Get paginated messages between two users
     */
    @Transactional(readOnly = true)
    public Page<Message> getConversationPaged(Integer userId1, Integer userId2, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());
        return messageRepository.findConversationPaged(userId1, userId2, pageable);
    }
    
    /**
     * Mark a message as read
     */
    @Transactional
    public Message markAsRead(Integer messageId, Integer userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with id: " + messageId));
        
        // Verify the user is the recipient
        if (!message.getRecipientId().equals(userId)) {
            throw new IllegalArgumentException("User is not the recipient of this message");
        }
        
        if (!message.getIsRead()) {
            message.setIsRead(true);
            message.setReadAt(LocalDateTime.now());
            message = messageRepository.save(message);
            logger.info("Message {} marked as read by user {}", messageId, userId);
        }
        
        return message;
    }
    
    /**
     * Mark all messages in a conversation as read
     */
    @Transactional
    public void markConversationAsRead(Integer currentUserId, Integer partnerId) {
        List<Message> unreadMessages = messageRepository.findUnreadMessages(currentUserId);
        
        unreadMessages.stream()
                .filter(message -> message.getSenderId().equals(partnerId))
                .forEach(message -> {
                    message.setIsRead(true);
                    message.setReadAt(LocalDateTime.now());
                    messageRepository.save(message);
                });
        
        logger.info("All messages from user {} to user {} marked as read", partnerId, currentUserId);
    }
    
    /**
     * Get all conversation partners for a user with their latest message
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversations(Integer userId) {
        List<Message> latestMessages = messageRepository.findLatestMessagesForUser(userId);
        
        // Get all unique partner IDs
        List<Integer> partnerIds = latestMessages.stream()
                .map(message -> message.getSenderId().equals(userId) 
                        ? message.getRecipientId() 
                        : message.getSenderId())
                .distinct()
                .collect(Collectors.toList());
        
        // Get all user details in one query
        Map<Integer, User> usersMap = userRepository.findAllById(partnerIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));
        
        // Build response
        List<Map<String, Object>> conversations = new ArrayList<>();
        
        for (Message message : latestMessages) {
            Integer partnerId = message.getSenderId().equals(userId) 
                    ? message.getRecipientId() 
                    : message.getSenderId();
            
            User partner = usersMap.get(partnerId);
            if (partner == null) continue;
            
            Long unreadCount = messageRepository.countUnreadMessages(userId)
                    .longValue();
            
            Map<String, Object> conversationData = new HashMap<>();
            conversationData.put("partnerId", partnerId);
            conversationData.put("partnerName", partner.getPrenom() + " " + partner.getNom());
            conversationData.put("partnerRole", partner.getRole().getNom());
            conversationData.put("profilePicture", partner.getProfilePicturePath());
            conversationData.put("lastMessage", message);
            conversationData.put("unreadCount", unreadCount);
            
            conversations.add(conversationData);
        }
        
        return conversations;
    }
    
    /**
     * Get count of unread messages for a user
     */
    @Transactional(readOnly = true)
    public Long getUnreadMessageCount(Integer userId) {
        return messageRepository.countUnreadMessages(userId);
    }
    
    /**
     * Delete a message
     * Only the sender can delete their own message
     */
    @Transactional
    public void deleteMessage(Integer messageId, Integer userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with id: " + messageId));
        
        // Verify the user is the sender
        if (!message.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("User is not the sender of this message");
        }
        
        // Delete the message
        messageRepository.delete(message);
        logger.info("Message {} deleted by user {}", messageId, userId);
    }
    
    /**
     * Edit a message
     * Only the sender can edit their own message
     */
    @Transactional
    public Message editMessage(Integer messageId, Integer userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with id: " + messageId));
        
        // Verify the user is the sender
        if (!message.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("User is not the sender of this message");
        }
        
        // Check if the message can be edited (e.g., not too old)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime messageSentTime = message.getSentAt();
        
        // Optional: Add a time limit for editing messages (e.g., within 24 hours)
        // if (messageSentTime.plusHours(24).isBefore(now)) {
        //    throw new IllegalStateException("Message cannot be edited after 24 hours");
        // }
        
        // Update the message content
        message.setContent(newContent);
        message.setEdited(true);
        message.setIsEdited(true);
        message.setEditedAt(now);
        
        Message updatedMessage = messageRepository.save(message);
        logger.info("Message {} edited by user {}", messageId, userId);
        
        return updatedMessage;
    }
    
    /**
     * Helper method to validate if a user exists
     */
    private void validateUserExists(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found with id: " + userId);
        }
    }
} 