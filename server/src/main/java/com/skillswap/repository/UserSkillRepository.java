package com.skillswap.repository;

import com.skillswap.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    List<UserSkill> findByUserId(Long userId);
    List<UserSkill> findByUserIdAndType(Long userId, String type);
    Optional<UserSkill> findByUserIdAndSkillNameAndType(Long userId, String skillName, String type);
    boolean existsByUserIdAndSkillNameAndType(Long userId, String skillName, String type);
    long countByType(String type);
    
    List<UserSkill> findByCertificateUrlIsNotNull();
    List<UserSkill> findByCertificateUrlIsNotNullAndCertificateVerified(Boolean certificateVerified);

    @Query("SELECT us.skillName, COUNT(us) as cnt FROM UserSkill us WHERE us.type = :type GROUP BY us.skillName ORDER BY cnt DESC")
    List<Object[]> findTopSkillsByType(String type);
}
