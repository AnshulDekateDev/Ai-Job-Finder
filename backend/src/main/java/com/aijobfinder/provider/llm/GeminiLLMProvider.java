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
public class GeminiLLMProvider implements LLMProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiLLMProvider.class);
    private static final String DEFAULT_MODEL = "gemini-1.5-flash";
    private static final String GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiLLMProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderType() {
        return "GEMINI";
    }

    @Override
    public boolean testConnection(String apiKey, String modelName, String baseUrl) {
        try {
            String model = (modelName != null && !modelName.trim().isEmpty()) ? modelName : DEFAULT_MODEL;
            String prompt = "Reply with 'OK' if you can read this message.";
            String response = callGeminiApi(prompt, apiKey, model, baseUrl);
            return response != null && !response.trim().isEmpty();
        } catch (Exception e) {
            log.warn("Gemini connection test failed: {}", e.getMessage());
            throw new RuntimeException("Gemini test connection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String generate(String prompt, String apiKey, String modelName, String baseUrl) {
        String model = (modelName != null && !modelName.trim().isEmpty()) ? modelName : DEFAULT_MODEL;
        return callGeminiApi(prompt, apiKey, model, baseUrl);
    }

    @Override
    public CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl) {
        String prompt = "You are an expert HR and resume parser. Analyze the following resume text carefully and extract the candidate profile as a STRICT JSON object.\n" +
                "Rules:\n" +
                "1. Output ONLY a valid JSON object without markdown formatting or code fences if possible.\n" +
                "2. DO NOT hallucinate or invent skills, degrees, or experience not present in the text.\n" +
                "JSON format required:\n" +
                "{\n" +
                "  \"candidateName\": \"Full Name\",\n" +
                "  \"email\": \"email@example.com\",\n" +
                "  \"phone\": \"phone\",\n" +
                "  \"location\": \"City, Country\",\n" +
                "  \"yearsOfExperience\": 2.5,\n" +
                "  \"highestDegree\": \"Degree Name\",\n" +
                "  \"summary\": \"Brief 2 sentence summary\",\n" +
                "  \"skills\": [\"Java\", \"Spring Boot\", \"REST API\", \"PostgreSQL\"],\n" +
                "  \"preferredRoles\": [\"Java Developer\", \"Backend Developer\"],\n" +
                "  \"locations\": [\"India\", \"Remote India\", \"Remote Worldwide\"],\n" +
                "  \"remotePreference\": [\"REMOTE\", \"HYBRID\", \"ON_SITE\"],\n" +
                "  \"experience\": [{\"title\": \"Software Engineer\", \"company\": \"ABC Corp\", \"duration\": \"2022-2024\", \"description\": \"...\", \"skills\": [\"Java\", \"Spring\"] }],\n" +
                "  \"education\": [{\"degree\": \"B.Tech in Computer Science\", \"institution\": \"XYZ University\", \"year\": \"2022\"}],\n" +
                "  \"projects\": [{\"name\": \"E-Commerce App\", \"description\": \"...\", \"technologies\": [\"Spring Boot\", \"React\"] }]\n" +
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
            log.error("Failed to parse resume JSON from Gemini: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse resume with Gemini: " + e.getMessage(), e);
        }
    }

    @Override
    public MatchAnalysis explainMatch(CandidateProfile profile, Job job, double matchScore, String apiKey, String modelName, String baseUrl) {
        String prompt = "You are an AI job match auditor. Compare the Candidate Profile and Job Description and generate a factual explanation of the match.\n" +
                "Rules:\n" +
                "1. Output ONLY a valid JSON object.\n" +
                "2. Be concise, transparent, and do not invent details.\n" +
                "Format:\n" +
                "{\n" +
                "  \"matchSummary\": \"Strong match for Java, Spring Boot, and PostgreSQL. Candidate has solid backend foundation.\",\n" +
                "  \"experienceSummary\": \"Job requires 0-2 years. Candidate profile has 1.5 years.\",\n" +
                "  \"locationSummary\": \"Job is remote and candidate accepts remote work.\",\n" +
                "  \"matchedSkills\": [\"Java\", \"Spring Boot\", \"PostgreSQL\"],\n" +
                "  \"missingSkills\": [\"AWS\", \"Kubernetes\"]\n" +
                "}\n\n" +
                "Candidate Skills: " + profile.getSkillsJson() + "\n" +
                "Candidate Experience: " + profile.getYearsOfExperience() + " years\n" +
                "Candidate Location: " + profile.getLocation() + "\n\n" +
                "Job Title: " + job.getTitle() + "\n" +
                "Job Company: " + job.getCompany() + "\n" +
                "Job Location: " + job.getLocation() + " (Remote: " + job.getRemoteType() + ")\n" +
                "Job Requirements: " + job.getRequirements() + "\n" +
                "Job Description snippet: " + (job.getDescription() != null && job.getDescription().length() > 500 ? job.getDescription().substring(0, 500) : job.getDescription());

        try {
            String rawJson = generate(prompt, apiKey, modelName, baseUrl);
            String cleanedJson = cleanJsonOutput(rawJson);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String matchSummary = root.has("matchSummary") ? root.get("matchSummary").asText() : "Good overall alignment with job requirements.";
            String expSummary = root.has("experienceSummary") ? root.get("experienceSummary").asText() : "Experience requirements aligned.";
            String locSummary = root.has("locationSummary") ? root.get("locationSummary").asText() : "Location requirements compatible.";

            List<String> matched = new ArrayList<>();
            if (root.has("matchedSkills") && root.get("matchedSkills").isArray()) {
                for (JsonNode node : root.get("matchedSkills")) {
                    matched.add(node.asText());
                }
            }

            List<String> missing = new ArrayList<>();
            if (root.has("missingSkills") && root.get("missingSkills").isArray()) {
                for (JsonNode node : root.get("missingSkills")) {
                    missing.add(node.asText());
                }
            }

            return new MatchAnalysis(matchSummary, expSummary, locSummary, matched, missing);
        } catch (Exception e) {
            log.warn("Gemini match explanation fallback: {}", e.getMessage());
            return new MatchAnalysis(
                    "Algorithmic match computed at " + Math.round(matchScore) + "%. Matches core technical competencies.",
                    "Candidate experience aligns with target role level.",
                    "Candidate work preferences match posting.",
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }
    }

    @Override
    public String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl) {
        String prompt = "You are a professional career advisor and copywriter. Write a high-impact, tailored cover letter for the candidate applying to the job below.\n" +
                "STRICT RULES:\n" +
                "1. NEVER invent or hallucinate experience, skills, metrics, achievements, or degrees not provided in the candidate profile.\n" +
                "2. Length: STRICTLY 150 to 250 words.\n" +
                "3. Professional, engaging, confident tone.\n" +
                "4. Format with clean paragraphs suitable for direct copy-paste.\n\n" +
                "Candidate Name: " + profile.getCandidateName() + "\n" +
                "Candidate Skills: " + profile.getSkillsJson() + "\n" +
                "Candidate Experience: " + profile.getExperienceJson() + "\n" +
                "Candidate Education: " + profile.getEducationJson() + "\n\n" +
                "Target Job:\n" +
                "Title: " + job.getTitle() + "\n" +
                "Company: " + job.getCompany() + "\n" +
                "Location: " + job.getLocation() + "\n" +
                "Description: " + (job.getDescription() != null && job.getDescription().length() > 800 ? job.getDescription().substring(0, 800) : job.getDescription());

        return generate(prompt, apiKey, modelName, baseUrl);
    }

    private String callGeminiApi(String prompt, String apiKey, String modelName, String customBaseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Gemini API key is required");
        }

        String base = (customBaseUrl != null && !customBaseUrl.trim().isEmpty()) ? customBaseUrl : GEMINI_API_BASE;
        if (!base.endsWith("/")) {
            base += "/";
        }
        String endpoint = base + modelName + ":generateContent?key=" + apiKey.trim();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = Collections.singletonMap("text", prompt);
        Map<String, Object> partsObj = Collections.singletonMap("parts", Collections.singletonList(textPart));
        Map<String, Object> requestBody = Collections.singletonMap("contents", Collections.singletonList(partsObj));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).path("text").asText();
                    }
                }
            }
            throw new RuntimeException("Unexpected response from Gemini API: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("Error communicating with Gemini API: {}", e.getMessage());
            throw new RuntimeException("Gemini API error: " + e.getMessage(), e);
        }
    }

    private String cleanJsonOutput(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }
}
