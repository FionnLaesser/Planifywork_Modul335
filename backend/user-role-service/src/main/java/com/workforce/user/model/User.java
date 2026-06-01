package com.workforce.user.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * JPA-Entity für die Tabelle {@code users}.
 * Repräsentiert einen Benutzer im Workforce Management System
 * (Admin, HR, Schichtleiter oder Mitarbeiter).
 */
@Data
@Entity
@Table(name = "users")
public class User {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Eindeutiger Benutzername für den Login */
    @Column(nullable = false, unique = true)
    private String username;

    /** Eindeutige E-Mail-Adresse des Benutzers */
    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt-gehashtes Passwort – wird nie im Klartext gespeichert */
    @Column(nullable = false)
    private String password;

    /** Vorname des Benutzers */
    private String firstName;

    /** Nachname des Benutzers */
    private String lastName;

    /**
     * Zugewiesene Rolle. Wird mit EAGER geladen, da die Rolle
     * bei fast jedem Zugriff benötigt wird.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /**
     * Gibt an ob der Benutzer aktiv ist.
     * Inaktive Benutzer können sich nicht einloggen.
     */
    private boolean active = true;

    /** Zeitstempel der Erstellung des Benutzers */
    private LocalDateTime createdAt;

    /**
     * Setzt den Erstellungszeitpunkt automatisch vor dem ersten Persistieren.
     */
    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
