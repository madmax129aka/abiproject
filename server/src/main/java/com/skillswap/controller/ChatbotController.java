package com.skillswap.controller;

import com.skillswap.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final GeminiService geminiService;

    @PostMapping("/message")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
        if (messages == null || messages.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Messages required"));
        String reply = geminiService.chatbotReply(messages);
        return ResponseEntity.ok(Map.of("success", true, "reply", reply));
    }
}
