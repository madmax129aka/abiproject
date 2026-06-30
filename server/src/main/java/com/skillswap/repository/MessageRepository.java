package com.skillswap.repository;

import com.skillswap.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByMatchIdOrderByCreatedAtAsc(Long matchId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.readAt = CURRENT_TIMESTAMP WHERE m.matchId = :matchId AND m.receiverId = :receiverId AND m.readAt IS NULL")
    void markAsRead(@Param("matchId") Long matchId, @Param("receiverId") Long receiverId);
}
