package com.skillswap.repository;

import com.skillswap.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByMatchIdOrderByScheduledAtDesc(Long matchId);
    List<Session> findByTeacherIdOrLearnerId(Long teacherId, Long learnerId);
    long countByScheduledAtAfter(LocalDateTime date);
}
