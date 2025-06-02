package com.projet.molarisse.role;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.projet.molarisse.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Role {
    public static final String ADMIN = "admin";
    public static final String DOCTOR = "doctor";
    public static final String SECRETAIRE = "secretaire";
    public static final String PATIENT = "patient";
    public static final String LABO = "labo";
    public static final String FOURNISSEUR = "fournisseur";
    public static final String PHARMACIE = "pharmacie";

    @Id
    @GeneratedValue
    private Integer id;
    @Column(unique = true)
    private String nom;
    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> users;
    @Column(name = "numbers")
    private int numbers;
    @CreatedDate
    @Column(nullable = false, updatable = false )
    private LocalDateTime creationDate;
    @LastModifiedDate
    @Column(insertable = false)
    private LocalDateTime modificationDate;
}
