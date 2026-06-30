package com.skillswap.repository;

import com.skillswap.entity.SkillMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<SkillMatch, Long> {
    @Query("SELECT m FROM SkillMatch m WHERE (m.userA = :userId OR m.userB = :userId) AND m.status <> 'blocked' ORDER BY m.matchPercentage DESC")
    List<SkillMatch> findMatchesByUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM SkillMatch m WHERE (m.userA = :userA AND m.userB = :userB) OR (m.userA = :userB AND m.userB = :userA)")
    Optional<SkillMatch> findByUserPair(@Param("userA") Long userA, @Param("userB") Long userB);

    @Modifying
    @Transactional
    @Query("UPDATE SkillMatch m SET m.status = :status WHERE ((m.userA = :userA AND m.userB = :userB) OR (m.userA = :userB AND m.userB = :userA)) AND m.status = 'active'")
    void updateStatusByUserPair(@Param("userA") Long userA, @Param("userB") Long userB, @Param("status") String status);

    long countByStatus(String status);
}
