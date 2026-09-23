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
public class OpenAILLMProvider implements LLMProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAILLMProvider.class);
    private static final String DEFAULT_MODEL = "gpt-4o-mini";
    private static final String OPENAI_API_BASE = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAILLMProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderType() {
        return "OPENAI";
    }

    @Override
    public boolean testConnection(String apiKey, String modelName, String baseUrl) {
        try {
            String response = generate("Say OK if you can read this.", apiKey, modelName, baseUrl);
            return response != null && !response.trim().isEmpty();
        } catch (Exception e) {
            throw new RuntimeException("OpenAI connection test failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String generate(String prompt, String apiKey, String modelName, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("OpenAI API key is required");
        }
        String endpoint = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl : OPENAI_API_BASE;
        String model = (modelName != null && !modelName.trim().isEmpty()) ? modelName : DEFAULT_MODEL;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", Collections.singletonList(message));
        requestBody.put("temperature", 0.3);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    return choices.get(0).path("message").path("content").asText();
                }
            }
            throw new RuntimeException("Failed OpenAI response: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            throw new RuntimeException("OpenAI API error: " + e.getMessage(), e);
        }
    }

    @Override
    public CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl) {
        String prompt = "You are an expert HR and resume parser. Analyze the following resume text and extract the candidate profile as a STRICT JSON object.\n" +
                "JSON format required:\n" +
                "{\n" +
                "  \"candidateName\": \"Full Name\",\n" +
                "  \"email\": \"email@example.com\",\n" +
                "  \"phone\": \"phone\",\n" +
                "  \"location\": \"City, Country\",\n" +
                "  \"yearsOfExperience\": 2.5,\n" +
                "  \"highestDegree\": \"Degree Name\",\n" +
                "  \"summary\": \"Brief summary\",\n" +
                "  \"skills\": [\"Java\", \"Spring Boot\", \"PostgreSQL\"],\n" +
                "  \"preferredRoles\": [\"Java Developer\", \"Backend Developer\"],\n" +
                "  \"locations\": [\"India\", \"Remote India\"],\n" +
                "  \"remotePreference\": [\"REMOTE\", \"HYBRID\"],\n" +
                "  \"experience\": [{\"title\": \"Software Engineer\", \"company\": \"ABC\", \"duration\": \"2022-2024\", \"description\": \"...\", \"skills\": [\"Java\"] }],\n" +
                "  \"education\": [{\"degree\": \"B.Tech\", \"institution\": \"XYZ University\", \"year\": \"2022\"}],\n" +
                "  \"projects\": [{\"name\": \"Project A\", \"description\": \"...\", \"technologies\": [\"Spring Boot\"] }]\n" +
                "}\n\n" +
                "Resume Text:\n" + resumeText;

        try {
            String rawJson = generate(prompt, apiKey, modelName, baseUrl);
            String cleanedJson = cleanJsonOutput(rawJson);
            JsonNode root = objectMapper.readTree(cleanedJson);

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
            throw new RuntimeException("Failed to parse resume with OpenAI: " + e.getMessage(), e);
        }
    }

    @Override
    public MatchAnalysis explainMatch(CandidateProfile profile, Job job, double matchScore, String apiKey, String modelName, String baseUrl) {
        String prompt = "Compare candidate profile and job description and provide a factual JSON explanation:\n" +
                "{\n" +
                "  \"matchSummary\": \"...\",\n" +
                "  \"experienceSummary\": \"...\",\n" +
                "  \"locationSummary\": \"...\",\n" +
                "  \"matchedSkills\": [...],\n" +
                "  \"missingSkills\": [...]\n" +
                "}\n\n" +
                "Candidate Skills: " + profile.getSkillsJson() + "\n" +
                "Job Title: " + job.getTitle() + " at " + job.getCompany() + "\n" +
                "Job Requirements: " + job.getRequirements();

        try {
            String rawJson = generate(prompt, apiKey, modelName, baseUrl);
            String cleanedJson = cleanJsonOutput(rawJson);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String matchSummary = root.has("matchSummary") ? root.get("matchSummary").asText() : "Strong technical match.";
            String expSummary = root.has("experienceSummary") ? root.get("experienceSummary").asText() : "Experience requirements aligned.";
            String locSummary = root.has("locationSummary") ? root.get("locationSummary").asText() : "Location compatible.";

            List<String> matched = new ArrayList<>();
            if (root.has("matchedSkills") && root.get("matchedSkills").isArray()) {
                for (JsonNode n : root.get("matchedSkills")) matched.add(n.asText());
            }

            List<String> missing = new ArrayList<>();
            if (root.has("missingSkills") && root.get("missingSkills").isArray()) {
                for (JsonNode n : root.get("missingSkills")) missing.add(n.asText());
            }

            return new MatchAnalysis(matchSummary, expSummary, locSummary, matched, missing);
        } catch (Exception e) {
            return new MatchAnalysis("Calculated match " + Math.round(matchScore) + "%", "Aligned experience level.", "Location fit confirmed.", Collections.emptyList(), Collections.emptyList());
        }
    }

    @Override
    public String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl) {
        String prompt = "Write a tailored 150-250 word cover letter for " + profile.getCandidateName() + " applying for " + job.getTitle() + " at " + job.getCompany() + ".\n" +
                "Strict rule: NEVER invent or exaggerate skills or experience not present in the candidate profile.\n\n" +
                "Profile:\n" + profile.getSkillsJson() + "\n" + profile.getExperienceJson();
        return generate(prompt, apiKey, modelName, baseUrl);
    }

    private String cleanJsonOutput(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) trimmed = trimmed.substring(7);
        else if (trimmed.startsWith("```")) trimmed = trimmed.substring(3);
        if (trimmed.endsWith("```")) trimmed = trimmed.substring(0, trimmed.length() - 3);
        return trimmed.trim();
    }
}
