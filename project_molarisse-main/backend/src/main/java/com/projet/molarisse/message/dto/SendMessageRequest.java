package com.projet.molarisse.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    
    @NotNull(message = "Recipient ID is required")
    private Integer recipientId;
    
    @NotBlank(message = "Message content cannot be empty")
    private String content;
    
    private String mediaType; // "IMAGE", "VOICE", or null for text
    
    private String mediaPath; // Path to the stored media file
} 