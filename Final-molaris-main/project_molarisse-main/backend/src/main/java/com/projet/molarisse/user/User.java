package com.projet.molarisse.user;

import com.projet.molarisse.appointment.Appointment;
import com.projet.molarisse.role.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.projet.molarisse.notifications.Notification;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name ="_user")
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails, Principal {
    @Id
    @GeneratedValue
    private Integer id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    //bch ywli el email unique
    @Column(unique=true)
    private String email;
    private String password;
    private String address;
    private String phoneNumber;
    private String profilePicturePath;
    private boolean accountLocked;
    private boolean enabled;
    private boolean visible;
    private boolean banned = false;
    private String certificationFilePath;
    //batinda
    private String PatenteFilePath;
    @ElementCollection
    @CollectionTable(name = "user_specialities", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "speciality")
    private List<String> specialities;

    // Doctor professional info fields
    private String orderNumber; // RPPS/Order number
    private String cabinetAdresse; // Doctor's office address
    private String ville; // City

    @ManyToMany(mappedBy = "users")
    private List<Role> roles;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @CreatedDate
    @Column(nullable = false, updatable = false )
    private LocalDateTime creationDate;
    @LastModifiedDate

    @Column(insertable = false)
    private LocalDateTime modificationDate;
  @OneToMany(mappedBy = "patient")
    @JsonBackReference
    private List<Appointment> patientAppointments; // Appointments where the user is the patient

    @OneToMany(mappedBy = "doctor")
    @JsonBackReference
    private List<Appointment> doctorAppointments; // Appointments where the user is the doctor

    @OneToMany(mappedBy = "secretary")
    @JsonBackReference
    private List<Appointment> secretaryAppointments; // Appointments managed by the secreta

    @OneToMany(mappedBy = "user")
    @JsonBackReference
    private List<Notification> notifications;

    @OneToMany(mappedBy = "assignedDoctor")
    @JsonBackReference
    private List<User> secretaries; // Secretaries assigned to this doctor

    @ManyToOne
    @JoinColumn(name = "assigned_doctor_id")
    @JsonManagedReference
    private User assignedDoctor; // Doctor to whom this secretary is assigned

    private String cvFilePath; // Path to the secretary's CV file

    @Enumerated(EnumType.STRING)
    private SecretaryStatus secretaryStatus = SecretaryStatus.NONE; // Status of the secretary application

    private boolean welcomeSeen = false;

    public boolean isWelcomeSeen() {
        return welcomeSeen;
    }
    public void setWelcomeSeen(boolean welcomeSeen) {
        this.welcomeSeen = welcomeSeen;
    }

    @Override
    //htyt email khtrha our unique identifier
    public String getName() {
        return email;
    }

    @Override

    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Add both formats for backward compatibility with existing tokens
        return List.of(
            new SimpleGrantedAuthority("ROLE_" + role.getNom().toUpperCase()),
            new SimpleGrantedAuthority(role.getNom())
        );
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Always return true to allow all users to authenticate
        // The banned status will be handled by the frontend
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    @Override
    public boolean isEnabled() {
        return enabled;
    }
    public String fullname(){
        return nom+" "+prenom;
    }
    
}
