package com.skillswap.repository;

import com.skillswap.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    List<User> findByRoleAndIsActiveAndIsBannedAndSkillSetupCompleteAndIdNot(
        String role, Boolean isActive, Boolean isBanned, Boolean skillSetupComplete, Long id);
    
    List<User> findByIsActiveAndIsBannedAndSkillSetupCompleteAndIdNotAndIdNotIn(
        Boolean isActive, Boolean isBanned, Boolean skillSetupComplete, Long id, List<Long> blockedIds);
    
    List<User> findByIsActiveAndIsBannedAndSkillSetupCompleteAndIdNot(
        Boolean isActive, Boolean isBanned, Boolean skillSetupComplete, Long id);

    Page<User> findByRoleAndFullNameContainingIgnoreCaseOrRoleAndEmailContainingIgnoreCase(
        String role1, String name, String role2, String email, Pageable pageable);
    
    Page<User> findByRole(String role, Pageable pageable);
    Page<User> findByRoleAndIsBanned(String role, Boolean isBanned, Pageable pageable);

    long countByRole(String role);
    long countByCreatedAtBetweenAndRole(LocalDateTime start, LocalDateTime end, String role);
}
