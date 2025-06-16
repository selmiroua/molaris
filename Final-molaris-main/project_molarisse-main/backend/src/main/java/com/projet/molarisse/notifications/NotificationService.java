package com.projet.molarisse.notifications;

import com.projet.molarisse.user.User;
import com.projet.molarisse.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.projet.molarisse.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(User user, String message, NotificationType type, String link) {
        log.info("Creating notification for user ID: {}, name: {} {}, message: {}, type: {}", 
                user.getId(), user.getPrenom(), user.getNom(), message, type);
        
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .link(link)
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification created successfully with ID: {}", savedNotification.getId());
        } catch (Exception e) {
            log.error("Error creating notification for user ID: {}", user.getId(), e);
            throw e;
        }
    }
    
    public void createNotification(Integer userId, String message, NotificationType type) {
        log.info("Creating notification for user ID: {}, message: {}, type: {}", userId, message, type);
        
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            
            createNotification(user, message, type, "/secretary/dashboard");
        } catch (Exception e) {
            log.error("Error creating notification for user ID: {}", userId, e);
            throw e;
        }
    }

    public List<Notification> getNotificationsForUser(Integer userId) {
        log.debug("Getting notifications for user ID: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getAllNotificationsForUser(Integer userId) {
        log.debug("Getting all notifications for user ID: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotificationsForUser(Integer userId) {
        log.debug("Getting unread notifications for user ID: {}", userId);
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Integer notificationId, Integer userId) {
        log.debug("Marking notification ID: {} as read for user ID: {}", notificationId, userId);
        notificationRepository.findByIdAndUserId(notificationId, userId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(Integer userId) {
        log.debug("Marking all notifications as read for user ID: {}", userId);
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    public long getUnreadCount(Integer userId) {
        log.debug("Getting unread count for user ID: {}", userId);
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
} 