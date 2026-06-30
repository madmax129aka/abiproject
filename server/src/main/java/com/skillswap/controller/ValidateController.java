package com.skillswap.controller;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.skillswap.entity.Notification;
import com.skillswap.entity.UserSkill;
import com.skillswap.entity.ValidationSession;
import com.skillswap.repository.NotificationRepository;
import com.skillswap.repository.UserSkillRepository;
import com.skillswap.repository.ValidationSessionRepository;
import com.skillswap.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/validate")
@RequiredArgsConstructor
public class ValidateController {

    private final GeminiService geminiService;
    private final ValidationSessionRepository validationSessionRepository;
    private final UserSkillRepository userSkillRepository;
    private final NotificationRepository notificationRepository;
    private final Gson gson = new Gson();

    @PostMapping("/questions")
    public ResponseEntity<?> generateQuestions(@RequestAttribute("userId") Long userId, @RequestBody Map<String, String> body) {
        String skillName = body.get("skillName");
        if (skillName == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Skill name required"));
        String level = body.getOrDefault("experienceLevel", "Intermediate");

        List<Map<String, Object>> questions = geminiService.generateQuestions(skillName, level);

        ValidationSession session = ValidationSession.builder()
                .userId(userId).skillName(skillName).experienceLevel(level)
                .questions(gson.toJson(questions)).build();
        session = validationSessionRepository.save(session);

        // Return questions without correctAnswer
        List<Map<String, Object>> questionsForUser = new ArrayList<>();
        for (Map<String, Object> q : questions) {
            Map<String, Object> qCopy = new HashMap<>();
            qCopy.put("question", q.get("question"));
            qCopy.put("options", q.get("options"));
            questionsForUser.add(qCopy);
        }

        return ResponseEntity.ok(Map.of("success", true, "sessionId", session.getId(), "questions", questionsForUser));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswers(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> body) {
        Long sessionId = Long.valueOf(body.get("sessionId").toString().replace(".0", ""));
        List<String> answers = (List<String>) body.get("answers");
        if (sessionId == null || answers == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Session ID and answers required"));

        ValidationSession session = validationSessionRepository.findByIdAndUserId(sessionId, userId).orElse(null);
        if (session == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Session not found"));

        // Parse questions
        List<Map<String, Object>> questions = gson.fromJson(session.getQuestions(), new TypeToken<List<Map<String, Object>>>(){}.getType());

        // Build questions with answers
        List<Map<String, Object>> qwa = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> qa = new HashMap<>(questions.get(i));
            qa.put("userAnswer", i < answers.size() ? answers.get(i) : "");
            qwa.add(qa);
        }

        Map<String, Object> result = geminiService.evaluateAnswers(session.getSkillName(), qwa);

        int score = ((Number) result.get("score")).intValue();
        boolean passed = (boolean) result.get("passed");

        session.setUserAnswers(gson.toJson(answers));
        session.setScore(score);
        session.setPassed(passed);
        session.setAiFeedback((String) result.get("feedback"));
        session.setPerQuestionFeedback(gson.toJson(result.get("perQuestion")));
        validationSessionRepository.save(session);

        if (passed) {
            userSkillRepository.findByUserIdAndSkillNameAndType(userId, session.getSkillName(), "teach")
                    .ifPresent(us -> { us.setIsVerified(true); us.setValidationScore(score); userSkillRepository.save(us); });
            notificationRepository.save(Notification.builder().userId(userId).type("system")
                    .message("Congratulations! You're now a Verified Teacher for " + session.getSkillName() + "!")
                    .link("/profile/" + userId).build());
        }

        return ResponseEntity.ok(Map.of("success", true, "result", result));
    }

    @PostMapping("/certificate")
    public ResponseEntity<?> verifyCertificate(@RequestAttribute("userId") Long userId, @RequestBody Map<String, String> body) {
        String skillName = body.get("skillName");
        if (skillName == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Skill name required"));
        // Simple acceptance for now
        Map<String, Object> result = Map.of("valid", true, "confidence", 75, "reason", "Certificate accepted for review");
        userSkillRepository.findByUserIdAndSkillNameAndType(userId, skillName, "teach")
                .ifPresent(us -> { us.setCertificateVerified(true); us.setCertificateUrl(body.get("certificateUrl")); userSkillRepository.save(us); });
        return ResponseEntity.ok(Map.of("success", true, "result", result));
    }
}
