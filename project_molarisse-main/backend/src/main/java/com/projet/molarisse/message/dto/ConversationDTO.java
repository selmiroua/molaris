package com.projet.molarisse.message.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private Integer partnerId;
    private String partnerName;
    private String partnerRole;
    private String profilePicture;
    private String lastMessageContent;
    private LocalDateTime lastMessageTime;
    private Boolean isLastMessageMine;
    private Long unreadCount;
} 