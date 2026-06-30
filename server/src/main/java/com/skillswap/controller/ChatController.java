package com.skillswap.controller;

import com.skillswap.entity.*;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;
    private final SessionRepository sessionRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping("/{matchId}/messages")
    public ResponseEntity<?> getMessages(@RequestAttribute("userId") Long userId, @PathVariable Long matchId) {
        SkillMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Match not found"));
        if (!match.getUserA().equals(userId) && !match.getUserB().equals(userId))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

        List<Message> messages = messageRepository.findByMatchIdOrderByCreatedAtAsc(matchId);
        List<Map<String, Object>> formatted = new ArrayList<>();
        for (Message m : messages) {
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("_id", m.getId());
            mMap.put("content", m.getContent());
            mMap.put("type", m.getType());
            mMap.put("createdAt", m.getCreatedAt());
            mMap.put("isSpam", m.getIsSpam());

            User sender = userRepository.findById(m.getSenderId()).orElse(null);
            mMap.put("senderId", Map.of("_id", m.getSenderId(), "fullName", sender != null ? sender.getFullName() : ""));
            mMap.put("receiverId", Map.of("_id", m.getReceiverId()));
            formatted.add(mMap);
        }
        return ResponseEntity.ok(Map.of("success", true, "messages", formatted));
    }

    @PostMapping("/{matchId}/messages")
    public ResponseEntity<?> sendMessage(@RequestAttribute("userId") Long userId, @PathVariable Long matchId, @RequestBody Map<String, String> body) {
        SkillMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Match not found"));

        Long receiverId = match.getUserA().equals(userId) ? match.getUserB() : match.getUserA();
        Message msg = Message.builder().matchId(matchId).senderId(userId).receiverId(receiverId)
                .content(body.get("content")).type(body.getOrDefault("type", "text")).resourceUrl(body.get("resourceUrl")).build();
        msg = messageRepository.save(msg);

        User sender = userRepository.findById(userId).orElse(null);
        notificationRepository.save(Notification.builder().userId(receiverId).type("message")
                .message("New message from " + (sender != null ? sender.getFullName() : "")).link("/chat/" + matchId).build());

        Map<String, Object> response = new HashMap<>();
        response.put("_id", msg.getId());
        response.put("content", msg.getContent());
        response.put("type", msg.getType());
        response.put("createdAt", msg.getCreatedAt());
        return ResponseEntity.status(201).body(Map.of("success", true, "message", response));
    }

    @PostMapping("/{matchId}/session")
    public ResponseEntity<?> scheduleSession(@RequestAttribute("userId") Long userId, @PathVariable Long matchId, @RequestBody Map<String, Object> body) {
        SkillMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Match not found"));

        String skillName = (String) body.get("skillName");
        String scheduledAt = (String) body.get("scheduledAt");
        if (skillName == null || scheduledAt == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Skill and time required"));

        Long otherUserId = match.getUserA().equals(userId) ? match.getUserB() : match.getUserA();
        Session session = Session.builder().matchId(matchId).teacherId(userId).learnerId(otherUserId)
                .skillName(skillName).scheduledAt(LocalDateTime.parse(scheduledAt)).build();
        session = sessionRepository.save(session);

        User sender = userRepository.findById(userId).orElse(null);
        notificationRepository.save(Notification.builder().userId(otherUserId).type("session")
                .message((sender != null ? sender.getFullName() : "") + " scheduled a " + skillName + " session!").link("/chat/" + matchId).build());

        // System message
        messageRepository.save(Message.builder().matchId(matchId).senderId(userId).receiverId(otherUserId)
                .content("Session scheduled: " + skillName + " on " + scheduledAt).type("system").build());

        return ResponseEntity.status(201).body(Map.of("success", true, "session", session));
    }

    @GetMapping("/{matchId}/sessions")
    public ResponseEntity<?> getSessions(@PathVariable Long matchId) {
        List<Session> sessions = sessionRepository.findByMatchIdOrderByScheduledAtDesc(matchId);
        return ResponseEntity.ok(Map.of("success", true, "sessions", sessions));
    }
}
