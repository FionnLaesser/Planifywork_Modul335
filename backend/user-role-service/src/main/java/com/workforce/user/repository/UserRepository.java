package com.workforce.user.repository;

import com.workforce.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository für die {@link User}-Entity.
 * Bietet CRUD-Operationen sowie rollenbasierte und namensbasierte Abfragen.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Gibt alle Benutzer mit einer bestimmten Rolle zurück.
     *
     * @param roleName Name der Rolle (z.B. "SHIFT_LEAD")
     * @return Liste der Benutzer mit dieser Rolle
     */
    List<User> findByRole_Name(String roleName);

    /**
     * Gibt alle Benutzer zurück, deren Vor- oder Nachname den Suchbegriff enthält.
     * Suche ist case-insensitiv.
     *
     * @param firstName Suchbegriff für den Vornamen
     * @param lastName  Suchbegriff für den Nachnamen
     * @return Liste der passenden Benutzer
     */
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);

    /**
     * Sucht einen Benutzer anhand seines Benutzernamens.
     *
     * @param username Benutzername
     * @return {@link Optional} mit dem gefundenen Benutzer
     */
    Optional<User> findByUsername(String username);

    /**
     * Prüft ob ein Benutzername bereits vergeben ist.
     *
     * @param username Benutzername
     * @return {@code true} wenn bereits vorhanden
     */
    boolean existsByUsername(String username);

    /**
     * Prüft ob eine E-Mail-Adresse bereits vergeben ist.
     *
     * @param email E-Mail-Adresse
     * @return {@code true} wenn bereits vorhanden
     */
    boolean existsByEmail(String email);
}
