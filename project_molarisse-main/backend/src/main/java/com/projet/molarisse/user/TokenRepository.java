package com.projet.molarisse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Integer> {

    Optional<Token> findByToken(String token);
    
    @Query("SELECT t FROM Token t WHERE t.user.id = :userId AND t.expiresAt > :now AND t.validatedAt IS NULL")
    List<Token> findAllValidTokensByUser(@Param("userId") Integer userId, @Param("now") LocalDateTime now);
    
    // Overloaded method for convenience, using current time
    default List<Token> findAllValidTokensByUser(Integer userId) {
        return findAllValidTokensByUser(userId, LocalDateTime.now());
    }
}
