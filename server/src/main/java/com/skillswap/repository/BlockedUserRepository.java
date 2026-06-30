package com.skillswap.repository;

import com.skillswap.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    List<BlockedUser> findByUserId(Long userId);
    Optional<BlockedUser> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
    boolean existsByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
}
