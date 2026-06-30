package com.skillswap.controller;

import com.skillswap.entity.*;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final SessionRepository sessionRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestAttribute("userId") Long userId) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));

        long totalUsers = userRepository.countByRole("user");
        long activeMatches = matchRepository.countByStatus("active");
        LocalDateTime today = LocalDate.now().atStartOfDay();
        long sessionsToday = sessionRepository.countByScheduledAtAfter(today);
        long pendingCerts = userSkillRepository.findByCertificateUrlIsNotNullAndCertificateVerified(false).size();
        long openReports = reportRepository.count();

        List<Map<String, Object>> last7Days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime start = LocalDate.now().minusDays(i).atStartOfDay();
            LocalDateTime end = start.plusDays(1);
            long count = userRepository.countByCreatedAtBetweenAndRole(start, end, "user");
            last7Days.add(Map.of("date", start.toLocalDate().toString(), "count", count));
        }

        List<Object[]> topSkills = userSkillRepository.findTopSkillsByType("teach");
        List<Map<String, Object>> topTeach = new ArrayList<>();
        for (Object[] row : topSkills) {
            if (topTeach.size() >= 10) break;
            topTeach.add(Map.of("_id", row[0], "count", ((Number) row[1]).intValue()));
        }

        return ResponseEntity.ok(Map.of("success", true, "stats", Map.of(
                "totalUsers", totalUsers, "activeMatches", activeMatches,
                "sessionsToday", sessionsToday, "pendingCertificates", pendingCerts,
                "openReports", openReports, "newUsersLast7Days", last7Days, "topTeachSkills", topTeach)));
    }


    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestAttribute("userId") Long userId,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "20") int limit,
                                       @RequestParam(required = false) String search,
                                       @RequestParam(required = false) String status) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));

        PageRequest pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        Page<User> result;
        if (search != null && !search.isEmpty()) {
            result = userRepository.searchByRoleAndNameOrEmail("user", search, pageable);
        } else if ("banned".equals(status)) {
            result = userRepository.findByRoleAndIsBanned("user", true, pageable);
        } else if ("active".equals(status)) {
            result = userRepository.findByRoleAndIsBanned("user", false, pageable);
        } else {
            result = userRepository.findByRole("user", pageable);
        }

        return ResponseEntity.ok(Map.of("success", true, "users", result.getContent(),
                "pagination", Map.of("page", page, "limit", limit, "total", result.getTotalElements(), "pages", result.getTotalPages())));
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@RequestAttribute("userId") Long adminId, @PathVariable Long id) {
        User admin = userRepository.findById(adminId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));

        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
        user.setIsBanned(!user.getIsBanned());
        userRepository.save(user);
        notificationRepository.save(Notification.builder().userId(id).type("system")
                .message(user.getIsBanned() ? "Your account has been suspended." : "Your account has been reactivated.").build());
        return ResponseEntity.ok(Map.of("success", true, "message", user.getIsBanned() ? "User banned" : "User unbanned", "isBanned", user.getIsBanned()));
    }

    @GetMapping("/certificates")
    public ResponseEntity<?> getCertificates(@RequestAttribute("userId") Long userId) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        List<UserSkill> certs = userSkillRepository.findByCertificateUrlIsNotNull();
        return ResponseEntity.ok(Map.of("success", true, "certificates", certs));
    }

    @PutMapping("/certificates/{id}/verify")
    public ResponseEntity<?> verifyCert(@RequestAttribute("userId") Long userId, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        boolean approved = (boolean) body.getOrDefault("approved", false);
        UserSkill us = userSkillRepository.findById(id).orElse(null);
        if (us == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Not found"));
        us.setCertificateVerified(approved);
        if (approved) us.setIsVerified(true);
        userSkillRepository.save(us);
        return ResponseEntity.ok(Map.of("success", true, "message", approved ? "Approved" : "Rejected"));
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(@RequestAttribute("userId") Long userId) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        return ResponseEntity.ok(Map.of("success", true, "reports", reportRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PutMapping("/reports/{id}/action")
    public ResponseEntity<?> reportAction(@RequestAttribute("userId") Long userId, @PathVariable Long id, @RequestBody Map<String, String> body) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        String action = body.get("action");
        Report report = reportRepository.findById(id).orElse(null);
        if (report == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Report not found"));
        if ("ban".equals(action)) { User u = userRepository.findById(report.getReportedUserId()).orElse(null); if(u!=null){u.setIsBanned(true);userRepository.save(u);}}
        else if ("dismiss".equals(action)) reportRepository.delete(report);
        else if ("warn".equals(action)) notificationRepository.save(Notification.builder().userId(report.getReportedUserId()).type("system").message("Warning: Your account has been flagged.").build());
        return ResponseEntity.ok(Map.of("success", true, "message", "Action applied"));
    }

    @PostMapping("/skills")
    public ResponseEntity<?> addSkill(@RequestAttribute("userId") Long userId, @RequestBody Map<String, String> body) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        String name = body.get("name"), category = body.get("category");
        if (name == null || category == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Name and category required"));
        Skill skill = Skill.builder().name(name).category(category).build();
        skill = skillRepository.save(skill);
        return ResponseEntity.status(201).body(Map.of("success", true, "skill", skill));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<?> deleteSkill(@RequestAttribute("userId") Long userId, @PathVariable Long id) {
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || !"admin".equals(admin.getRole()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Admin only"));
        skillRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Skill removed"));
    }
}
