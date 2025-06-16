package com.projet.molarisse.notifications;

import com.projet.molarisse.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    private Integer id;
    private Integer userId;
    private String message;
    private NotificationType type;
    private boolean read;
    private LocalDateTime createdAt;
    private String link;
    
    public static NotificationDTO fromEntity(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .link(notification.getLink())
                .build();
    }
} 