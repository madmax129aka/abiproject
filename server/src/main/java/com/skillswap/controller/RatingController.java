package com.skillswap.controller;

import com.skillswap.entity.*;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingRepository ratingRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @PostMapping
    public ResponseEntity<?> createRating(@RequestAttribute("userId") Long userId,
                                           @RequestBody Map<String, Object> body) {
        Long sessionId = Long.valueOf(body.get("sessionId").toString().replace(".0",""));
        Long rateeId = Long.valueOf(body.get("rateeId").toString().replace(".0",""));
        String role = (String) body.get("role");
        int stars = ((Number) body.get("stars")).intValue();
        String feedback = (String) body.get("feedback");

        if (stars < 1 || stars > 5)
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Stars must be 1-5"));

        Session session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null)
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Session not found"));

        if (ratingRepository.findBySessionIdAndRaterIdAndRateeId(sessionId, userId, rateeId).isPresent())
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Already rated"));

        Rating rating = Rating.builder()
                .sessionId(sessionId).matchId(session.getMatchId())
                .raterId(userId).rateeId(rateeId)
                .role(role).stars(stars).feedback(feedback).build();
        rating = ratingRepository.save(rating);

        // Update reputation
        List<Rating> allRatings = ratingRepository.findByRateeIdOrderByCreatedAtDesc(rateeId);
        double avg = allRatings.stream().mapToInt(Rating::getStars).average().orElse(0);
        User ratee = userRepository.findById(rateeId).orElse(null);
        if (ratee != null) {
            ratee.setReputationScore(Math.round(avg * 10.0) / 10.0);
            userRepository.save(ratee);
        }

        session.setRated(true);
        session.setStatus("completed");
        sessionRepository.save(session);

        User rater = userRepository.findById(userId).orElse(null);
        notificationRepository.save(Notification.builder().userId(rateeId).type("rating")
                .message((rater != null ? rater.getFullName() : "") + " rated you " + stars + " stars!")
                .link("/profile/" + rateeId).build());

        return ResponseEntity.status(201).body(Map.of("success", true, "rating", rating));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSessionRatings(@PathVariable Long sessionId) {
        return ResponseEntity.ok(Map.of("success", true, "ratings", ratingRepository.findBySessionId(sessionId)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserRatings(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("success", true, "ratings", ratingRepository.findByRateeIdOrderByCreatedAtDesc(userId)));
    }
}
