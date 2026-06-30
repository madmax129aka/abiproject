package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long skillId;

    @Column(nullable = false, length = 100)
    private String skillName;

    @Column(nullable = false, length = 10)
    private String type; // "teach" or "learn"

    @Column(length = 20)
    @Builder.Default
    private String experienceLevel = "Beginner";

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Integer validationScore = 0;

    @Column(length = 500)
    private String certificateUrl;

    @Builder.Default
    private Boolean certificateVerified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
