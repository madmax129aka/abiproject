package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches", uniqueConstraints = @UniqueConstraint(columnNames = {"userA", "userB"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userA;

    @Column(nullable = false)
    private Long userB;

    @Column(columnDefinition = "JSON")
    private String userATeaches; // JSON array

    @Column(columnDefinition = "JSON")
    private String userBTeaches; // JSON array

    @Builder.Default
    private Integer matchPercentage = 0;

    @Column(columnDefinition = "JSON")
    private String commonInterests; // JSON array

    @Column(length = 20)
    @Builder.Default
    private String status = "active";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
