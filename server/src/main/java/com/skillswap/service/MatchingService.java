package com.skillswap.service;

import com.google.gson.Gson;
import com.skillswap.entity.*;
import com.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final MatchRepository matchRepository;
    private final NotificationRepository notificationRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final Gson gson = new Gson();

    public List<Map<String, Object>> runMatchingForUser(Long userId) {
        List<UserSkill> userTeachSkills = userSkillRepository.findByUserIdAndType(userId, "teach");
        List<UserSkill> userLearnSkills = userSkillRepository.findByUserIdAndType(userId, "learn");

        List<String> userTeachNames = userTeachSkills.stream().map(s -> s.getSkillName().toLowerCase()).collect(Collectors.toList());
        List<String> userLearnNames = userLearnSkills.stream().map(s -> s.getSkillName().toLowerCase()).collect(Collectors.toList());

        if (userTeachNames.isEmpty() || userLearnNames.isEmpty()) return Collections.emptyList();

        List<BlockedUser> blockedEntries = blockedUserRepository.findByUserId(userId);
        List<Long> blockedIds = blockedEntries.stream().map(BlockedUser::getBlockedUserId).collect(Collectors.toList());
        blockedIds.add(0L); // prevent empty list issues

        User currentUser = userRepository.findById(userId).orElseThrow();

        List<User> otherUsers = userRepository.findByIsActiveAndIsBannedAndSkillSetupCompleteAndIdNot(true, false, true, userId);

        List<Map<String, Object>> matches = new ArrayList<>();

        for (User otherUser : otherUsers) {
            if (blockedIds.contains(otherUser.getId())) continue;
            if (blockedUserRepository.existsByUserIdAndBlockedUserId(otherUser.getId(), userId)) continue;

            List<UserSkill> otherTeach = userSkillRepository.findByUserIdAndType(otherUser.getId(), "teach");
            List<UserSkill> otherLearn = userSkillRepository.findByUserIdAndType(otherUser.getId(), "learn");

            List<String> otherTeachNames = otherTeach.stream().map(s -> s.getSkillName().toLowerCase()).collect(Collectors.toList());
            List<String> otherLearnNames = otherLearn.stream().map(s -> s.getSkillName().toLowerCase()).collect(Collectors.toList());

            List<String> userCanTeachOther = userTeachNames.stream().filter(otherLearnNames::contains).collect(Collectors.toList());
            List<String> otherCanTeachUser = otherTeachNames.stream().filter(userLearnNames::contains).collect(Collectors.toList());

            if (!userCanTeachOther.isEmpty() && !otherCanTeachUser.isEmpty()) {
                Set<String> allSkills = new HashSet<>();
                allSkills.addAll(userTeachNames); allSkills.addAll(userLearnNames);
                allSkills.addAll(otherTeachNames); allSkills.addAll(otherLearnNames);

                int mutualCount = userCanTeachOther.size() + otherCanTeachUser.size();
                int matchPct = Math.min(Math.round((float) mutualCount / Math.max(allSkills.size() / 2f, 1f) * 100), 100);
                List<String> commonInterests = userLearnNames.stream().filter(otherLearnNames::contains).collect(Collectors.toList());

                // Upsert match
                Optional<SkillMatch> existing = matchRepository.findByUserPair(userId, otherUser.getId());
                if (existing.isEmpty()) {
                    SkillMatch m = SkillMatch.builder()
                            .userA(userId).userB(otherUser.getId())
                            .userATeaches(gson.toJson(userCanTeachOther))
                            .userBTeaches(gson.toJson(otherCanTeachUser))
                            .matchPercentage(matchPct)
                            .commonInterests(gson.toJson(commonInterests))
                            .status("active").build();
                    matchRepository.save(m);

                    notificationRepository.save(Notification.builder().userId(otherUser.getId()).type("match")
                            .message("New skill match found! You and " + currentUser.getFullName() + " can exchange skills.").link("/matches").build());
                    notificationRepository.save(Notification.builder().userId(userId).type("match")
                            .message("New skill match found! You and " + otherUser.getFullName() + " can exchange skills.").link("/matches").build());
                } else {
                    SkillMatch m = existing.get();
                    m.setMatchPercentage(matchPct);
                    m.setCommonInterests(gson.toJson(commonInterests));
                    matchRepository.save(m);
                }

                Map<String, Object> matchInfo = new HashMap<>();
                matchInfo.put("otherUserId", otherUser.getId());
                matchInfo.put("otherUserName", otherUser.getFullName());
                matchInfo.put("matchPercentage", matchPct);
                matchInfo.put("userATeaches", userCanTeachOther);
                matchInfo.put("userBTeaches", otherCanTeachUser);
                matchInfo.put("commonInterests", commonInterests);
                matches.add(matchInfo);
            }
        }

        matches.sort((a, b) -> (int) b.get("matchPercentage") - (int) a.get("matchPercentage"));
        return matches;
    }
}
