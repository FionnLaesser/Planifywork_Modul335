package com.workforce.user.repository;

import com.workforce.user.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA Repository für die {@link Role}-Entity.
 * Bietet CRUD-Operationen und eine Suche nach Rollenname.
 */
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Sucht eine Rolle anhand ihres Namens.
     *
     * @param name Rollenname (z.B. "HR", "SHIFT_LEAD")
     * @return {@link Optional} mit der gefundenen Rolle
     */
    Optional<Role> findByName(String name);
}
