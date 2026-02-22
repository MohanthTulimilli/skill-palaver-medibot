package com.medibots.repository;

import com.medibots.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRoleRepository extends JpaRepository<UserRole, String> {
    Optional<UserRole> findByUserId(String userId);
}
