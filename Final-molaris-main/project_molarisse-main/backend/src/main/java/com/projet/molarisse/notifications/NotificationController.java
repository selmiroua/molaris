package com.projet.molarisse.notifications;

import com.projet.molarisse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

/**
 * Controller for handling notification-related endpoints
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Notification> notifications = notificationService.getAllNotificationsForUser(user.getId());
        List<NotificationDTO> notificationDTOs = notifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notificationDTOs);
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Notification> notifications = notificationService.getUnreadNotificationsForUser(user.getId());
        List<NotificationDTO> notificationDTOs = notifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notificationDTOs);
    }
    
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        long count = notificationService.getUnreadNotificationsForUser(user.getId()).size();
        
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/mark-read/{notificationId}")
    public ResponseEntity<?> markNotificationAsRead(
            Authentication authentication,
            @PathVariable Integer notificationId
    ) {
        User user = (User) authentication.getPrincipal();
        notificationService.markAsRead(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllNotificationsAsRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
} 