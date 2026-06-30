package com.skillswap.websocket;

import com.skillswap.entity.Message;
import com.skillswap.entity.User;
import com.skillswap.repository.MessageRepository;
import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @MessageMapping("/chat.send/{matchId}")
    public void sendMessage(@DestinationVariable Long matchId, @Payload Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        String content = (String) payload.get("content");
        String type = (String) payload.getOrDefault("type", "text");

        Message msg = Message.builder()
                .matchId(matchId)
                .senderId(senderId)
                .receiverId(receiverId)
                .content(content)
                .type(type)
                .build();
        msg = messageRepository.save(msg);

        User sender = userRepository.findById(senderId).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("_id", msg.getId());
        response.put("matchId", matchId);
        response.put("content", content);
        response.put("type", type);
        response.put("createdAt", msg.getCreatedAt());
        response.put("senderId", Map.of("_id", senderId, "fullName", sender != null ? sender.getFullName() : ""));
        response.put("receiverId", Map.of("_id", receiverId));

        messagingTemplate.convertAndSend("/topic/match." + matchId, response);
    }

    @MessageMapping("/chat.typing/{matchId}")
    public void typing(@DestinationVariable Long matchId, @Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/match." + matchId + ".typing", payload);
    }
}
