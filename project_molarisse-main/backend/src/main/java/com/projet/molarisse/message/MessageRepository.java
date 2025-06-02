package com.projet.molarisse.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {
    
    // Find all messages between two users
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = ?1 AND m.recipientId = ?2) OR " +
           "(m.senderId = ?2 AND m.recipientId = ?1) " +
           "ORDER BY m.sentAt DESC")
    List<Message> findConversation(Integer userId1, Integer userId2);
    
    // Find all messages between two users with paging
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = ?1 AND m.recipientId = ?2) OR " +
           "(m.senderId = ?2 AND m.recipientId = ?1) " +
           "ORDER BY m.sentAt DESC")
    Page<Message> findConversationPaged(Integer userId1, Integer userId2, Pageable pageable);
    
    // Find all unread messages for a user
    @Query("SELECT m FROM Message m WHERE m.recipientId = ?1 AND m.isRead = false ORDER BY m.sentAt DESC")
    List<Message> findUnreadMessages(Integer userId);
    
    // Count unread messages for a user
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientId = ?1 AND m.isRead = false")
    Long countUnreadMessages(Integer userId);
    
    // Find users who have had conversations with the given user
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.senderId = ?1 THEN m.recipientId ELSE m.senderId END " +
           "FROM Message m " +
           "WHERE m.senderId = ?1 OR m.recipientId = ?1 " +
           "ORDER BY MAX(m.sentAt) DESC")
    List<Integer> findConversationPartnerIds(Integer userId);
    
    // Find latest message in each conversation
    @Query(value = "SELECT * FROM messages m1 WHERE m1.sent_at = " +
           "(SELECT MAX(m2.sent_at) FROM messages m2 WHERE " +
           "(m2.sender_id = m1.sender_id AND m2.recipient_id = m1.recipient_id) OR " +
           "(m2.sender_id = m1.recipient_id AND m2.recipient_id = m1.sender_id)) " +
           "AND (m1.sender_id = ?1 OR m1.recipient_id = ?1) " +
           "ORDER BY m1.sent_at DESC", nativeQuery = true)
    List<Message> findLatestMessagesForUser(Integer userId);
} 