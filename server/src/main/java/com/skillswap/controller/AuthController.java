package com.skillswap.controller;

import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String fullName = body.get("fullName");
            String email = body.get("email");
            String password = body.get("password");
            if (fullName == null || email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Full name, email and password are required"));
            }
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password must be at least 6 characters"));
            }
            Map<String, Object> result = authService.register(fullName, email, password,
                    body.get("dob"), body.get("gender"), body.get("mobile"),
                    body.get("preferredLanguage"), body.get("location"));
            result.put("success", true);
            result.put("message", "Registration successful");
            return ResponseEntity.status(201).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email and password are required"));
            }
            Map<String, Object> result = authService.login(email, password);
            result.put("success", true);
            result.put("message", "Login successful");
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            int status = e.getMessage().contains("suspended") ? 403 : 401;
            return ResponseEntity.status(status).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestAttribute("userId") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        return ResponseEntity.ok(Map.of("success", true, "user", authService.buildUserResponse(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }
}
