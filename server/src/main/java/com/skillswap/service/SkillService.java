package com.skillswap.service;

import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getAllSkills() {
        List<Skill> skills = skillRepository.findAll();
        Map<String, List<Skill>> grouped = skills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory));
        Map<String, Object> result = new HashMap<>();
        result.put("skills", skills);
        result.put("grouped", grouped);
        return result;
    }

    public UserSkill addUserSkill(Long userId, String skillName, String type, String experienceLevel, String certUrl) {
        if (userSkillRepository.existsByUserIdAndSkillNameAndType(userId, skillName, type)) {
            throw new RuntimeException("You already have \"" + skillName + "\" as a " + type + " skill");
        }
        Skill skill = skillRepository.findByName(skillName).orElse(null);
        UserSkill us = UserSkill.builder()
                .userId(userId)
                .skillId(skill != null ? skill.getId() : null)
                .skillName(skillName)
                .type(type)
                .experienceLevel(type.equals("teach") ? (experienceLevel != null ? experienceLevel : "Beginner") : "Beginner")
                .certificateUrl(certUrl)
                .build();
        return userSkillRepository.save(us);
    }

    public Map<String, Object> addBatch(Long userId, List<Map<String, String>> teachSkills, List<String> learnSkills) {
        List<UserSkill> teachResults = new ArrayList<>();
        List<UserSkill> learnResults = new ArrayList<>();

        if (teachSkills != null) {
            for (Map<String, String> skill : teachSkills) {
                String name = skill.get("name");
                String level = skill.getOrDefault("level", "Beginner");
                if (!userSkillRepository.existsByUserIdAndSkillNameAndType(userId, name, "teach")) {
                    Skill master = skillRepository.findByName(name).orElse(null);
                    UserSkill us = UserSkill.builder().userId(userId).skillId(master != null ? master.getId() : null)
                            .skillName(name).type("teach").experienceLevel(level).build();
                    teachResults.add(userSkillRepository.save(us));
                }
            }
        }

        if (learnSkills != null) {
            for (String name : learnSkills) {
                if (!userSkillRepository.existsByUserIdAndSkillNameAndType(userId, name, "learn")) {
                    Skill master = skillRepository.findByName(name).orElse(null);
                    UserSkill us = UserSkill.builder().userId(userId).skillId(master != null ? master.getId() : null)
                            .skillName(name).type("learn").experienceLevel("Beginner").build();
                    learnResults.add(userSkillRepository.save(us));
                }
            }
        }

        User user = userRepository.findById(userId).orElseThrow();
        user.setSkillSetupComplete(true);
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("teach", teachResults);
        result.put("learn", learnResults);
        return result;
    }

    public void deleteUserSkill(Long userSkillId, Long userId) {
        UserSkill us = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        if (!us.getUserId().equals(userId)) throw new RuntimeException("Unauthorized");
        userSkillRepository.delete(us);
    }
}
