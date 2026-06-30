package com.skillswap.controller;

import com.skillswap.entity.Notification;
import com.skillswap.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestAttribute("userId") Long userId) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long unread = notificationRepository.countByUserIdAndIsRead(userId, false);
        return ResponseEntity.ok(Map.of("success", true, "notifications", notifs, "unreadCount", unread));
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(@RequestAttribute("userId") Long userId) {
        notificationRepository.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }
}
