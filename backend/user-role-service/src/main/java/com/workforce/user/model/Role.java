package com.workforce.user.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * JPA-Entity für die Tabelle {@code roles}.
 * Repräsentiert eine Benutzerrolle im System (ADMIN, HR, SHIFT_LEAD, EMPLOYEE).
 */
@Data
@Entity
@Table(name = "roles")
public class Role {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Name der Rolle. Muss eindeutig und nicht null sein.
     * Entspricht den Werten aus {@link RoleName}.
     */
    @Column(nullable = false, unique = true)
    private String name;
}
