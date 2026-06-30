package com.skillswap.service;

import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> register(String fullName, String email, String password,
                                         String dob, String gender, String mobile,
                                         String preferredLanguage, String location) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email.toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(password))
                .dob(dob != null && !dob.isEmpty() ? LocalDate.parse(dob) : null)
                .gender(gender)
                .mobile(mobile)
                .preferredLanguage(preferredLanguage != null ? preferredLanguage : "en")
                .location(location)
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", buildUserResponse(user));
        return result;
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> optUser = userRepository.findByEmail(email.toLowerCase().trim());
        if (optUser.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = optUser.get();
        if (user.getIsBanned()) {
            throw new RuntimeException("Account suspended. Contact support.");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", buildUserResponse(user));
        return result;
    }

    public Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> u = new HashMap<>();
        u.put("_id", user.getId());
        u.put("fullName", user.getFullName());
        u.put("email", user.getEmail());
        u.put("role", user.getRole());
        u.put("preferredLanguage", user.getPreferredLanguage());
        u.put("reputationScore", user.getReputationScore());
        u.put("skillSetupComplete", user.getSkillSetupComplete());
        u.put("location", user.getLocation());
        return u;
    }
}
