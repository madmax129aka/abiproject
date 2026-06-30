package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "validation_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long skillId;

    @Column(nullable = false, length = 100)
    private String skillName;

    @Column(length = 20)
    private String experienceLevel;

    @Column(columnDefinition = "JSON")
    private String questions; // JSON array

    @Column(columnDefinition = "JSON")
    private String userAnswers; // JSON array

    @Builder.Default
    private Integer score = 0;

    @Builder.Default
    private Boolean passed = false;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(columnDefinition = "JSON")
    private String perQuestionFeedback; // JSON array

    @CreationTimestamp
    private LocalDateTime createdAt;
}
