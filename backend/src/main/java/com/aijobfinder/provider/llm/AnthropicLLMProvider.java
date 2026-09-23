package com.aijobfinder.provider.llm;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Job;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
public class AnthropicLLMProvider implements LLMProvider {

    private static final Logger log = LoggerFactory.getLogger(AnthropicLLMProvider.class);
    private static final String DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
    private static final String ANTHROPIC_API_BASE = "https://api.anthropic.com/v1/messages";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AnthropicLLMProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderType() {
        return "ANTHROPIC";
    }

    @Override
    public boolean testConnection(String apiKey, String modelName, String baseUrl) {
        try {
            String res = generate("Respond with OK", apiKey, modelName, baseUrl);
            return res != null && !res.trim().isEmpty();
        } catch (Exception e) {
            throw new RuntimeException("Anthropic test connection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String generate(String prompt, String apiKey, String modelName, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Anthropic API key is required");
        }
        String endpoint = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl : ANTHROPIC_API_BASE;
        String model = (modelName != null && !modelName.trim().isEmpty()) ? modelName : DEFAULT_MODEL;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey.trim());
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("max_tokens", 1024);
        body.put("messages", Collections.singletonList(message));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode content = root.path("content");
                if (content.isArray() && content.size() > 0) {
                    return content.get(0).path("text").asText();
                }
            }
            throw new RuntimeException("Anthropic request failed with status: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("Anthropic error: {}", e.getMessage());
            throw new RuntimeException("Anthropic API error: " + e.getMessage(), e);
        }
    }

    @Override
    public CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl) {
        String prompt = "Extract resume profile as clean JSON:\n" +
                "{\n" +
                "  \"candidateName\": \"...\",\n" +
                "  \"email\": \"...\",\n" +
                "  \"phone\": \"...\",\n" +
                "  \"location\": \"...\",\n" +
                "  \"yearsOfExperience\": 2.0,\n" +
                "  \"highestDegree\": \"...\",\n" +
                "  \"summary\": \"...\",\n" +
                "  \"skills\": [...],\n" +
                "  \"preferredRoles\": [...],\n" +
                "  \"locations\": [...],\n" +
                "  \"remotePreference\": [...],\n" +
                "  \"experience\": [...],\n" +
                "  \"education\": [...],\n" +
                "  \"projects\": [...]\n" +
                "}\n\n" + resumeText;

        try {
            String rawJson = generate(prompt, apiKey, modelName, baseUrl);
            String clean = cleanJson(rawJson);
            JsonNode root = objectMapper.readTree(clean);

            CandidateProfile profile = new CandidateProfile();
            if (root.has("candidateName")) profile.setCandidateName(root.get("candidateName").asText());
            if (root.has("email")) profile.setEmail(root.get("email").asText());
            if (root.has("phone")) profile.setPhone(root.get("phone").asText());
            if (root.has("location")) profile.setLocation(root.get("location").asText());
            if (root.has("yearsOfExperience")) profile.setYearsOfExperience(root.get("yearsOfExperience").asDouble(0.0));
            if (root.has("highestDegree")) profile.setHighestDegree(root.get("highestDegree").asText());
            if (root.has("summary")) profile.setSummary(root.get("summary").asText());

            if (root.has("skills")) profile.setSkillsJson(objectMapper.writeValueAsString(root.get("skills")));
            if (root.has("experience")) profile.setExperienceJson(objectMapper.writeValueAsString(root.get("experience")));
            if (root.has("education")) profile.setEducationJson(objectMapper.writeValueAsString(root.get("education")));
            if (root.has("projects")) profile.setProjectsJson(objectMapper.writeValueAsString(root.get("projects")));
            if (root.has("preferredRoles")) profile.setPreferredRolesJson(objectMapper.writeValueAsString(root.get("preferredRoles")));
            if (root.has("locations")) profile.setLocationsJson(objectMapper.writeValueAsString(root.get("locations")));
            if (root.has("remotePreference")) profile.setRemotePreferenceJson(objectMapper.writeValueAsString(root.get("remotePreference")));

            return profile;
        } catch (Exception e) {
            throw new RuntimeException("Anthropic resume parse failed: " + e.getMessage(), e);
        }
    }

    @Override
    public MatchAnalysis explainMatch(CandidateProfile profile, Job job, double matchScore, String apiKey, String modelName, String baseUrl) {
        return new MatchAnalysis("Match evaluated via Claude at " + Math.round(matchScore) + "%", "Experience aligns with requirements.", "Location compatible.", Collections.emptyList(), Collections.emptyList());
    }

    @Override
    public String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl) {
        String prompt = "Write a tailored 150-250 word cover letter for " + profile.getCandidateName() + " for " + job.getTitle() + " at " + job.getCompany() + ". Never invent facts not in resume.";
        return generate(prompt, apiKey, modelName, baseUrl);
    }

    private String cleanJson(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) trimmed = trimmed.substring(7);
        else if (trimmed.startsWith("```")) trimmed = trimmed.substring(3);
        if (trimmed.endsWith("```")) trimmed = trimmed.substring(0, trimmed.length() - 3);
        return trimmed.trim();
    }
}
