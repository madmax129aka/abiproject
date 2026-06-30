package com.skillswap.controller;

import com.skillswap.entity.*;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final RatingRepository ratingRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final ReportRepository reportRepository;
    private final MatchRepository matchRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));

        List<UserSkill> teachSkills = userSkillRepository.findByUserIdAndType(id, "teach");
        List<UserSkill> learnSkills = userSkillRepository.findByUserIdAndType(id, "learn");
        List<Rating> ratings = ratingRepository.findByRateeIdOrderByCreatedAtDesc(id);

        Map<String, Object> response = new HashMap<>();
        response.put("_id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("location", user.getLocation());
        response.put("reputationScore", user.getReputationScore());
        response.put("preferredLanguage", user.getPreferredLanguage());
        response.put("gender", user.getGender());
        response.put("mobile", user.getMobile());
        response.put("role", user.getRole());
        response.put("skillSetupComplete", user.getSkillSetupComplete());
        response.put("teachSkills", teachSkills);
        response.put("learnSkills", learnSkills);
        response.put("ratings", ratings);

        return ResponseEntity.ok(Map.of("success", true, "user", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@RequestAttribute("userId") Long userId, @PathVariable Long id, @RequestBody Map<String, String> body) {
        if (!userId.equals(id)) return ResponseEntity.status(403).body(Map.of("success", false, "message", "Unauthorized"));
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));

        if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
        if (body.containsKey("mobile")) user.setMobile(body.get("mobile"));
        if (body.containsKey("preferredLanguage")) user.setPreferredLanguage(body.get("preferredLanguage"));
        if (body.containsKey("location")) user.setLocation(body.get("location"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "user", user));
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<?> blockUser(@RequestAttribute("userId") Long userId, @PathVariable Long id) {
        if (userId.equals(id)) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Cannot block yourself"));
        blockedUserRepository.findByUserIdAndBlockedUserId(userId, id).orElseGet(() ->
                blockedUserRepository.save(BlockedUser.builder().userId(userId).blockedUserId(id).build()));
        return ResponseEntity.ok(Map.of("success", true, "message", "User blocked"));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportUser(@RequestAttribute("userId") Long userId, @PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        if (reason == null || reason.isEmpty()) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Reason required"));
        reportRepository.save(Report.builder().reporterId(userId).reportedUserId(id).reason(reason).build());
        return ResponseEntity.ok(Map.of("success", true, "message", "User reported"));
    }

    @GetMapping("/{id}/skills")
    public ResponseEntity<?> getUserSkills(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true,
                "teachSkills", userSkillRepository.findByUserIdAndType(id, "teach"),
                "learnSkills", userSkillRepository.findByUserIdAndType(id, "learn")));
    }
}
