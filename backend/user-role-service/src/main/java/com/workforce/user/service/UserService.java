package com.workforce.user.service;

import com.workforce.user.dto.CreateUserRequest;
import com.workforce.user.dto.UpdateUserRequest;
import com.workforce.user.dto.UserResponse;
import com.workforce.user.exception.ResourceNotFoundException;
import com.workforce.user.model.Role;
import com.workforce.user.model.User;
import com.workforce.user.repository.RoleRepository;
import com.workforce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service-Klasse für die Verwaltung von Benutzern und Rollen.
 * Implementiert die Geschäftslogik für die User Stories US-HR-01, US-HR-02 und US-HR-03.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository    userRepository;
    private final RoleRepository    roleRepository;
    private final PasswordEncoder   passwordEncoder;

    /**
     * Gibt alle Benutzer zurück, optional gefiltert nach Rolle und/oder Suchbegriff.
     * Implementiert US-HR-03 (Schichtleiter-Übersicht).
     *
     * @param role   Rollenname als Filter (z.B. "SHIFT_LEAD"), {@code null} für alle
     * @param search Suchbegriff für Vor- oder Nachname, {@code null} für alle
     * @return Liste der gefundenen {@link UserResponse}-Objekte
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(String role, String search) {
        List<User> users;

        if (role != null && search != null) {
            users = userRepository.findByRole_Name(role).stream()
                    .filter(u -> u.getFirstName().toLowerCase().contains(search.toLowerCase())
                              || u.getLastName().toLowerCase().contains(search.toLowerCase()))
                    .toList();
        } else if (role != null) {
            users = userRepository.findByRole_Name(role);
        } else if (search != null) {
            users = userRepository
                    .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(search, search);
        } else {
            users = userRepository.findAll();
        }

        return users.stream().map(UserResponse::from).toList();
    }

    /**
     * Gibt einen einzelnen Benutzer anhand seiner ID zurück.
     *
     * @param id Benutzer-ID
     * @return {@link UserResponse} des gefundenen Benutzers
     * @throws ResourceNotFoundException wenn kein Benutzer mit dieser ID existiert
     */
    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserResponse.from(findUserOrThrow(id));
    }

    /**
     * Legt einen neuen Benutzer an.
     * Implementiert US-HR-01 (Schichtleiter anlegen).
     *
     * @param request DTO mit den Benutzerdaten
     * @return {@link UserResponse} des neu erstellten Benutzers
     * @throws IllegalArgumentException wenn Benutzername oder E-Mail bereits vergeben sind
     * @throws ResourceNotFoundException wenn die angegebene Rolle nicht existiert
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException(
                    "Benutzername '" + request.username() + "' ist bereits vergeben");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                    "E-Mail '" + request.email() + "' ist bereits registriert");
        }

        Role role = roleRepository.findByName(request.roleName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Rolle '" + request.roleName() + "' nicht gefunden"));

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(role);

        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Aktualisiert einen bestehenden Benutzer.
     * Implementiert US-HR-02 (Schichtleiter bearbeiten / deaktivieren).
     * Nur nicht-null Felder im Request werden aktualisiert.
     *
     * @param id      ID des zu aktualisierenden Benutzers
     * @param request DTO mit den geänderten Feldern
     * @return {@link UserResponse} des aktualisierten Benutzers
     * @throws ResourceNotFoundException wenn kein Benutzer mit dieser ID existiert
     */
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName()  != null) user.setLastName(request.lastName());
        if (request.email()     != null) user.setEmail(request.email());
        if (request.active()    != null) user.setActive(request.active());

        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Deaktiviert einen Benutzer (Soft-Delete).
     * Der Datensatz bleibt in der Datenbank erhalten.
     *
     * @param id ID des zu deaktivierenden Benutzers
     * @throws ResourceNotFoundException wenn kein Benutzer mit dieser ID existiert
     */
    @Transactional
    public void deactivateUser(Long id) {
        User user = findUserOrThrow(id);
        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Hilfsmethode: sucht einen Benutzer und wirft eine Exception wenn nicht gefunden.
     *
     * @param id Benutzer-ID
     * @return gefundene {@link User}-Entity
     * @throws ResourceNotFoundException wenn kein Benutzer mit dieser ID existiert
     */
    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Benutzer mit ID " + id + " nicht gefunden"));
    }
}
