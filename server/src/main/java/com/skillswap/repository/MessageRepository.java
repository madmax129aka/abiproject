package com.skillswap.repository;

import com.skillswap.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByMatchIdOrderByCreatedAtAsc(Long matchId, Pageable pageable);
    List<Message> findByMatchIdOrderByCreatedAtAsc(Long matchId);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = CURRENT_TIMESTAMP WHERE m.matchId = :matchId AND m.receiverId = :receiverId AND m.readAt IS NULL")
    void markAsRead(Long matchId, Long receiverId);
}
