package com.skillswap.repository;

import com.skillswap.entity.SkillMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<SkillMatch, Long> {
    @Query("SELECT m FROM SkillMatch m WHERE (m.userA = :userId OR m.userB = :userId) AND m.status <> 'blocked' ORDER BY m.matchPercentage DESC")
    List<SkillMatch> findMatchesByUserId(Long userId);

    @Query("SELECT m FROM SkillMatch m WHERE (m.userA = :userA AND m.userB = :userB) OR (m.userA = :userB AND m.userB = :userA)")
    Optional<SkillMatch> findByUserPair(Long userA, Long userB);

    @Query("UPDATE SkillMatch m SET m.status = :status WHERE ((m.userA = :userA AND m.userB = :userB) OR (m.userA = :userB AND m.userB = :userA)) AND m.status = 'active'")
    void updateStatusByUserPair(Long userA, Long userB, String status);

    long countByStatus(String status);
}
