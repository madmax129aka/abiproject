package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private LocalDate dob;

    @Column(length = 20)
    private String gender;

    @Column(length = 20)
    private String mobile;

    @Column(length = 5)
    @Builder.Default
    private String preferredLanguage = "en";

    private String location;

    @Column(length = 10)
    @Builder.Default
    private String role = "user";

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean isBanned = false;

    @Builder.Default
    private Double reputationScore = 0.0;

    @Builder.Default
    private Integer teachRatingsCount = 0;

    @Builder.Default
    private Integer learnRatingsCount = 0;

    @Builder.Default
    private Integer totalRatingSum = 0;

    @Builder.Default
    private Boolean skillSetupComplete = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
