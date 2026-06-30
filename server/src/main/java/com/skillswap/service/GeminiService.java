package com.skillswap.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.lang.reflect.Type;
import java.util.*;

@Service
public class GeminiService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Gson gson = new Gson();

    private boolean isApiKeyValid() {
        return apiKey != null && !apiKey.isEmpty() && !apiKey.equals("your_gemini_api_key_here");
    }

    public List<Map<String, Object>> generateQuestions(String skillName, String experienceLevel) {
        if (!isApiKeyValid()) return getFallbackQuestions(skillName);

        try {
            String prompt = "You are an expert skill assessor. Generate exactly 10 multiple-choice questions to assess a user's knowledge of \"" + skillName + "\" at \"" + experienceLevel + "\" level.\n\nReturn ONLY a valid JSON array (no markdown, no code blocks) with this structure:\n[{ \"question\": \"...\", \"options\": [\"A) ...\", \"B) ...\", \"C) ...\", \"D) ...\"], \"correctAnswer\": \"A\" }]";
            String response = callGemini(prompt);
            String cleaned = response.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            Type listType = new TypeToken<List<Map<String, Object>>>(){}.getType();
            return gson.fromJson(cleaned, listType);
        } catch (Exception e) {
            return getFallbackQuestions(skillName);
        }
    }

    public Map<String, Object> evaluateAnswers(String skillName, List<Map<String, Object>> questionsWithAnswers) {
        if (!isApiKeyValid()) return evaluateFallback(questionsWithAnswers);

        try {
            String prompt = "You are an expert evaluator. The user was assessed on \"" + skillName + "\".\nHere are the questions and answers:\n" + gson.toJson(questionsWithAnswers) + "\n\nGrade each answer. Return ONLY valid JSON (no markdown):\n{ \"score\": <0-100>, \"passed\": <true if score >= 70>, \"feedback\": \"<summary>\", \"perQuestion\": [{ \"correct\": true/false, \"explanation\": \"brief\" }] }";
            String response = callGemini(prompt);
            String cleaned = response.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            Type mapType = new TypeToken<Map<String, Object>>(){}.getType();
            return gson.fromJson(cleaned, mapType);
        } catch (Exception e) {
            return evaluateFallback(questionsWithAnswers);
        }
    }

    public String chatbotReply(List<Map<String, String>> messages) {
        if (!isApiKeyValid()) return getFallbackChatReply(messages);

        try {
            StringBuilder sb = new StringBuilder();
            sb.append("You are SkillBot, the friendly AI assistant for SkillSwap — a peer-to-peer skill exchange platform. Help users find learning paths, recommend free resources. Be concise and warm. Keep responses under 200 words.\n\nConversation:\n");
            for (Map<String, String> m : messages) {
                sb.append(m.get("role").equals("user") ? "User: " : "SkillBot: ").append(m.get("content")).append("\n");
            }
            sb.append("\nRespond as SkillBot:");
            return callGemini(sb.toString());
        } catch (Exception e) {
            return getFallbackChatReply(messages);
        }
    }

    private String callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(gson.toJson(body), headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        Map<String, Object> responseMap = gson.fromJson(response.getBody(), Map.class);

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
        Map<String, Object> contentResp = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentResp.get("parts");
        return (String) parts.get(0).get("text");
    }

    private List<Map<String, Object>> getFallbackQuestions(String skillName) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String[][] qData = {
            {"What is the most fundamental concept in " + skillName + "?", "A) Core principles and foundations", "B) Advanced optimization", "C) Unrelated theory", "D) Marketing strategies", "A"},
            {"Which approach is best for mastering " + skillName + "?", "A) Only reading", "B) Consistent practice with theory", "C) Watching without doing", "D) Memorizing only", "B"},
            {"What distinguishes an expert in " + skillName + "?", "A) Years only", "B) Deep understanding and practical application", "C) Expensive tools", "D) Many unrelated skills", "B"},
            {"What is a common mistake when learning " + skillName + "?", "A) Starting with fundamentals", "B) Trying everything at once without foundations", "C) Practicing regularly", "D) Asking questions", "B"},
            {"How do you measure progress in " + skillName + "?", "A) Comparing to others", "B) Setting milestones and tracking achievements", "C) Cannot be measured", "D) Only formal testing", "B"},
            {"What role does feedback play in " + skillName + "?", "A) Not important", "B) Helps identify blind spots", "C) Only negative helps", "D) Should be ignored", "B"},
            {"Which resource is most valuable for " + skillName + "?", "A) Outdated textbooks", "B) Structured courses with projects", "C) Random social media", "D) Watching without practice", "B"},
            {"How would you explain " + skillName + " simply?", "A) Use complex jargon", "B) Use simple analogies and examples", "C) Say it's too hard", "D) Show unrelated content", "B"},
            {"What mindset helps with " + skillName + " challenges?", "A) Give up quickly", "B) Growth mindset - see challenges as opportunities", "C) Avoid all difficulty", "D) Only do what you know", "B"},
            {"What is the relationship of theory and practice in " + skillName + "?", "A) Theory unnecessary", "B) Both essential and complement each other", "C) Practice unnecessary", "D) Completely separate", "B"}
        };
        for (String[] q : qData) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("question", q[0]);
            qMap.put("options", List.of(q[1], q[2], q[3], q[4]));
            qMap.put("correctAnswer", q[5]);
            questions.add(qMap);
        }
        return questions;
    }

    private Map<String, Object> evaluateFallback(List<Map<String, Object>> qwa) {
        int correct = 0;
        List<Map<String, Object>> perQ = new ArrayList<>();
        for (Map<String, Object> qa : qwa) {
            boolean isCorrect = qa.getOrDefault("userAnswer", "").equals(qa.get("correctAnswer"));
            if (isCorrect) correct++;
            perQ.add(Map.of("correct", isCorrect, "explanation", isCorrect ? "Correct!" : "Incorrect. Answer was " + qa.get("correctAnswer")));
        }
        int score = Math.round((float) correct / qwa.size() * 100);
        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("passed", score >= 70);
        result.put("feedback", "You scored " + score + "% (" + correct + "/" + qwa.size() + ").");
        result.put("perQuestion", perQ);
        return result;
    }

    private String getFallbackChatReply(List<Map<String, String>> messages) {
        String last = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getOrDefault("content", "").toLowerCase();
        if (last.contains("hello") || last.contains("hi")) return "Hey! I'm SkillBot. I can help with learning paths, free resources, and platform tips. What would you like help with?";
        if (last.contains("python")) return "For Python:\n1. python.org tutorial (free)\n2. freeCodeCamp Python course\n3. Automate the Boring Stuff (free book)\n4. HackerRank challenges\n\nWant more specific recommendations?";
        if (last.contains("javascript") || last.contains("js")) return "For JavaScript:\n1. MDN Web Docs (free)\n2. freeCodeCamp JS course\n3. JavaScript30.com (30 projects)\n4. You Don't Know JS (free books)\n\nNeed framework-specific help?";
        if (last.contains("match") || last.contains("find")) return "To find matches:\n1. Complete your skill profile\n2. Go to Matches page\n3. Click 'Find My Matches'\n4. Chat with your matches!\n\nThe more skills you add, the better!";
        return "I'm SkillBot! I can help with:\n- Learning paths for any skill\n- Free resources & courses\n- Platform navigation tips\n\nTry asking 'How do I learn Python?' or 'How do I find matches?'";
    }
}
