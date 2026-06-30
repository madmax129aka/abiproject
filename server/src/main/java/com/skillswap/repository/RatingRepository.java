package com.skillswap.repository;

import com.skillswap.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findBySessionId(Long sessionId);
    List<Rating> findByRateeIdOrderByCreatedAtDesc(Long rateeId);
    Optional<Rating> findBySessionIdAndRaterIdAndRateeId(Long sessionId, Long raterId, Long rateeId);
}
