package com.skillswap.repository;

import com.skillswap.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findByIsActiveAndIsBannedAndSkillSetupCompleteAndIdNot(
            Boolean isActive, Boolean isBanned, Boolean skillSetupComplete, Long id);

    Page<User> findByRole(String role, Pageable pageable);
    Page<User> findByRoleAndIsBanned(String role, Boolean isBanned, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<User> searchByRoleAndNameOrEmail(@Param("role") String role, @Param("search") String search, Pageable pageable);

    long countByRole(String role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :start AND u.createdAt < :end AND u.role = :role")
    long countByCreatedAtBetweenAndRole(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("role") String role);
}
