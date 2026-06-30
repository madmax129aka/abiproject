package com.skillswap.controller;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.skillswap.entity.SkillMatch;
import com.skillswap.entity.User;
import com.skillswap.repository.MatchRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final Gson gson = new Gson();

    @PostMapping("/run")
    public ResponseEntity<?> runMatching(@RequestAttribute("userId") Long userId) {
        List<Map<String, Object>> matches = matchingService.runMatchingForUser(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Found " + matches.size() + " potential skill swap partners!", "matchCount", matches.size(), "matches", matches));
    }

    @GetMapping
    public ResponseEntity<?> getMatches(@RequestAttribute("userId") Long userId) {
        List<SkillMatch> matches = matchRepository.findMatchesByUserId(userId);
        List<Map<String, Object>> formatted = new ArrayList<>();

        for (SkillMatch m : matches) {
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("_id", m.getId());
            mMap.put("matchPercentage", m.getMatchPercentage());
            mMap.put("status", m.getStatus());
            mMap.put("userATeaches", parseJson(m.getUserATeaches()));
            mMap.put("userBTeaches", parseJson(m.getUserBTeaches()));
            mMap.put("commonInterests", parseJson(m.getCommonInterests()));

            User userA = userRepository.findById(m.getUserA()).orElse(null);
            User userB = userRepository.findById(m.getUserB()).orElse(null);

            mMap.put("userA", buildUserMap(userA));
            mMap.put("userB", buildUserMap(userB));
            formatted.add(mMap);
        }

        return ResponseEntity.ok(Map.of("success", true, "matches", formatted));
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<?> getMatch(@RequestAttribute("userId") Long userId, @PathVariable Long matchId) {
        SkillMatch m = matchRepository.findById(matchId).orElse(null);
        if (m == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Match not found"));
        if (!m.getUserA().equals(userId) && !m.getUserB().equals(userId))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

        Map<String, Object> mMap = new HashMap<>();
        mMap.put("_id", m.getId());
        mMap.put("userA", buildUserMap(userRepository.findById(m.getUserA()).orElse(null)));
        mMap.put("userB", buildUserMap(userRepository.findById(m.getUserB()).orElse(null)));
        mMap.put("matchPercentage", m.getMatchPercentage());
        mMap.put("status", m.getStatus());
        return ResponseEntity.ok(Map.of("success", true, "match", mMap));
    }

    private Map<String, Object> buildUserMap(User u) {
        if (u == null) return Map.of();
        Map<String, Object> map = new HashMap<>();
        map.put("_id", u.getId());
        map.put("fullName", u.getFullName());
        map.put("email", u.getEmail());
        map.put("reputationScore", u.getReputationScore());
        map.put("location", u.getLocation());
        return map;
    }

    private List<String> parseJson(String json) {
        if (json == null || json.isEmpty()) return List.of();
        try { return gson.fromJson(json, new TypeToken<List<String>>(){}.getType()); }
        catch (Exception e) { return List.of(); }
    }
}
