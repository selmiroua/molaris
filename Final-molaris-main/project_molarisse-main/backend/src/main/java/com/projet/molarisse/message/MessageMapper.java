package com.projet.molarisse.message;

import com.projet.molarisse.message.dto.ConversationDTO;
import com.projet.molarisse.message.dto.MessageDTO;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class MessageMapper {
    
    private final UserRepository userRepository;
    
    public MessageDTO toDTO(Message message, Integer currentUserId) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        User recipient = userRepository.findById(message.getRecipientId()).orElse(null);
        
        boolean isMine = message.getSenderId().equals(currentUserId);
        
        // Format the media path for frontend use
        String mediaPath = message.getMediaPath();
        if (mediaPath != null && !mediaPath.contains("/")) {
            mediaPath = "messages/" + mediaPath;
        }
        
        return MessageDTO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderName(sender != null ? sender.getPrenom() + " " + sender.getNom() : "Unknown User")
                .senderProfilePicture(sender != null ? sender.getProfilePicturePath() : null)
                .recipientId(message.getRecipientId())
                .recipientName(recipient != null ? recipient.getPrenom() + " " + recipient.getNom() : "Unknown User")
                .recipientProfilePicture(recipient != null ? recipient.getProfilePicturePath() : null)
                .content(message.getContent())
                .mediaType(message.getMediaType())
                .mediaPath(mediaPath)
                .sentAt(message.getSentAt())
                .readAt(message.getReadAt())
                .isRead(message.getIsRead())
                .isMine(isMine)
                .edited(message.getIsEdited())
                .editedAt(message.getEditedAt())
                .build();
    }
    
    public ConversationDTO toConversationDTO(Map<String, Object> conversationData, Integer currentUserId) {
        Message lastMessage = (Message) conversationData.get("lastMessage");
        boolean isLastMessageMine = lastMessage.getSenderId().equals(currentUserId);
        
        // Format the media path for frontend use
        String mediaPath = lastMessage.getMediaPath();
        if (mediaPath != null && !mediaPath.contains("/")) {
            mediaPath = "messages/" + mediaPath;
        }
        
        return ConversationDTO.builder()
                .partnerId((Integer) conversationData.get("partnerId"))
                .partnerName((String) conversationData.get("partnerName"))
                .partnerRole((String) conversationData.get("partnerRole"))
                .profilePicture((String) conversationData.get("profilePicture"))
                .lastMessageContent(lastMessage.getContent())
                .lastMessageMediaType(lastMessage.getMediaType())
                .lastMessageMediaPath(mediaPath)
                .lastMessageTime(lastMessage.getSentAt())
                .isLastMessageMine(isLastMessageMine)
                .unreadCount((Long) conversationData.get("unreadCount"))
                .build();
    }
} 