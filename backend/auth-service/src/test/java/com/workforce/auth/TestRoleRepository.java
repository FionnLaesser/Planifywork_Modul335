package com.workforce.auth;

import com.workforce.auth.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

interface TestRoleRepository extends JpaRepository<Role, Long> {}
