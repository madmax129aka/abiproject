package com.skillswap.controller;

import com.skillswap.entity.UserSkill;
import com.skillswap.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<?> getAllSkills() {
        Map<String, Object> result = skillService.getAllSkills();
        result.put("success", true);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/user")
    public ResponseEntity<?> addUserSkill(@RequestAttribute("userId") Long userId, @RequestBody Map<String, String> body) {
        try {
            String skillName = body.get("skillName");
            String type = body.get("type");
            if (skillName == null || type == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Skill name and type are required"));
            if (!type.equals("teach") && !type.equals("learn")) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Type must be teach or learn"));
            UserSkill us = skillService.addUserSkill(userId, skillName, type, body.get("experienceLevel"), body.get("certificateUrl"));
            return ResponseEntity.status(201).body(Map.of("success", true, "userSkill", us));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/user/batch")
    public ResponseEntity<?> addBatch(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> body) {
        try {
            List<Map<String, String>> teachSkills = (List<Map<String, String>>) body.get("teachSkills");
            List<String> learnSkills = (List<String>) body.get("learnSkills");
            Map<String, Object> results = skillService.addBatch(userId, teachSkills, learnSkills);
            return ResponseEntity.status(201).body(Map.of("success", true, "results", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userSkillId}")
    public ResponseEntity<?> deleteUserSkill(@RequestAttribute("userId") Long userId, @PathVariable Long userSkillId) {
        try {
            skillService.deleteUserSkill(userSkillId, userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Skill removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
