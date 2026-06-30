package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long matchId;

    @Column(nullable = false)
    private Long teacherId;

    @Column(nullable = false)
    private Long learnerId;

    @Column(nullable = false, length = 100)
    private String skillName;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(length = 20)
    @Builder.Default
    private String status = "scheduled";

    @Builder.Default
    private Boolean rated = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
