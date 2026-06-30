package com.skillswap.repository;

import com.skillswap.entity.ValidationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ValidationSessionRepository extends JpaRepository<ValidationSession, Long> {
    Optional<ValidationSession> findByIdAndUserId(Long id, Long userId);
}
