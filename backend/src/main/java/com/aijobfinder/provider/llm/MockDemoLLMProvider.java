package com.aijobfinder.provider.llm;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Job;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MockDemoLLMProvider implements LLMProvider {

    private final ObjectMapper objectMapper;

    public MockDemoLLMProvider(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderType() {
        return "DEMO_FALLBACK";
    }

    @Override
    public boolean testConnection(String apiKey, String modelName, String baseUrl) {
        return true;
    }

    @Override
    public String generate(String prompt, String apiKey, String modelName, String baseUrl) {
        return "Demo generated response: Please configure a Gemini, OpenAI, or Anthropic API key in Settings for live LLM inference.";
    }

    @Override
    public CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl) {
        CandidateProfile profile = new CandidateProfile();
        profile.setCandidateName(extractCandidateName(resumeText));
        profile.setEmail(extractEmail(resumeText));
        profile.setPhone(extractPhone(resumeText));
        profile.setLocation("India");
        profile.setYearsOfExperience(extractEstimatedYears(resumeText));
        profile.setHighestDegree("Bachelor of Technology (B.Tech)");
        profile.setSummary("Motivated software developer experienced in backend engineering, RESTful APIs, and distributed systems.");

        List<String> commonSkills = Arrays.asList(
                "Java", "Spring Boot", "REST API", "PostgreSQL", "MySQL", "Docker", "Git", "Microservices", "Python", "JavaScript", "React", "AWS", "SQL", "Redis", "Kafka", "Hibernate"
        );
        List<String> extractedSkills = new ArrayList<>();
        String lowerText = resumeText.toLowerCase();
        for (String skill : commonSkills) {
            if (lowerText.contains(skill.toLowerCase())) {
                extractedSkills.add(skill);
            }
        }
        if (extractedSkills.isEmpty()) {
            extractedSkills = Arrays.asList("Java", "Spring Boot", "REST API", "PostgreSQL", "Git");
        }

        try {
            profile.setSkillsJson(objectMapper.writeValueAsString(extractedSkills));
            profile.setPreferredRolesJson(objectMapper.writeValueAsString(Arrays.asList("Java Developer", "Backend Developer", "Software Engineer")));
            profile.setLocationsJson(objectMapper.writeValueAsString(Arrays.asList("India", "Remote India", "Remote Worldwide")));
            profile.setRemotePreferenceJson(objectMapper.writeValueAsString(Arrays.asList("REMOTE", "HYBRID")));

            Map<String, Object> exp = new HashMap<>();
            exp.put("title", "Software Engineer");
            exp.put("company", "Technology Solutions");
            exp.put("duration", "2023 - Present");
            exp.put("description", "Designed and built high-throughput REST APIs and Spring Boot microservices.");
            exp.put("skills", extractedSkills.subList(0, Math.min(3, extractedSkills.size())));
            profile.setExperienceJson(objectMapper.writeValueAsString(Collections.singletonList(exp)));

            Map<String, Object> edu = new HashMap<>();
            edu.put("degree", "B.Tech in Computer Science");
            edu.put("institution", "National University");
            edu.put("year", "2023");
            profile.setEducationJson(objectMapper.writeValueAsString(Collections.singletonList(edu)));

            Map<String, Object> proj = new HashMap<>();
            proj.put("name", "Scalable Job Aggregator Service");
            proj.put("description", "Built a resilient microservice architecture for job normalization and candidate matching.");
            proj.put("technologies", extractedSkills.subList(0, Math.min(4, extractedSkills.size())));
            profile.setProjectsJson(objectMapper.writeValueAsString(Collections.singletonList(proj)));
        } catch (Exception ignored) {}

        return profile;
    }

    @Override
    public MatchAnalysis explainMatch(CandidateProfile profile, Job job, double matchScore, String apiKey, String modelName, String baseUrl) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        try {
            List<String> userSkills = objectMapper.readValue(profile.getSkillsJson(), List.class);
            List<String> jobSkills = objectMapper.readValue(job.getSkillsJson(), List.class);
            for (String js : jobSkills) {
                boolean found = false;
                for (String us : userSkills) {
                    if (us.equalsIgnoreCase(js)) {
                        found = true;
                        matched.add(us);
                        break;
                    }
                }
                if (!found) {
                    missing.add(js);
                }
            }
        } catch (Exception ignored) {}

        String matchSum = "Strong technical match (" + Math.round(matchScore) + "%) based on candidate skills and requirements.";
        String expSum = "Candidate experience (" + profile.getYearsOfExperience() + " yrs) aligns with job requirements (" +
                job.getMinExperienceRequired() + " - " + job.getMaxExperienceRequired() + " yrs).";
        String locSum = "Job location (" + job.getLocation() + ", " + job.getRemoteType() + ") fits candidate preferences.";

        return new MatchAnalysis(matchSum, expSum, locSum, matched, missing);
    }

    @Override
    public String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl) {
        String name = profile.getCandidateName() != null ? profile.getCandidateName() : "Candidate";
        return "Dear Hiring Manager at " + job.getCompany() + ",\n\n" +
                "I am writing to express my enthusiastic interest in the " + job.getTitle() + " position. " +
                "With my background in software engineering and hands-on experience in " + getPrimarySkill(profile) + ", " +
                "I am confident in my ability to immediately add value to your team.\n\n" +
                "In my previous work, I have focused on engineering robust, high-performance services and collaborating on scalable architectures. " +
                "The technical vision and requirements at " + job.getCompany() + " resonate strongly with my professional trajectory.\n\n" +
                "I would welcome the opportunity to discuss how my skill set and dedication can contribute to your ongoing success.\n\n" +
                "Sincerely,\n" + name;
    }

    private String getPrimarySkill(CandidateProfile profile) {
        try {
            List<String> skills = objectMapper.readValue(profile.getSkillsJson(), List.class);
            if (!skills.isEmpty()) {
                return String.join(", ", skills.subList(0, Math.min(3, skills.size())));
            }
        } catch (Exception ignored) {}
        return "Java and backend architecture";
    }

    private String extractCandidateName(String text) {
        if (text == null || text.trim().isEmpty()) return "Candidate";
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() > 2 && trimmed.length() < 35 && !trimmed.contains("@") && !trimmed.contains("http") && !trimmed.toLowerCase().contains("resume")) {
                return trimmed;
            }
        }
        return "Candidate";
    }

    private String extractEmail(String text) {
        if (text == null) return "candidate@example.com";
        Pattern pattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group(0);
        return "candidate@example.com";
    }

    private String extractPhone(String text) {
        if (text == null) return "";
        Pattern pattern = Pattern.compile("(\\+?[0-9]{1,3}[-\\s]?)?(\\(?[0-9]{3}\\)?[-\\s]?)?[0-9]{3}[-\\s]?[0-9]{4}");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group(0);
        return "+91 9876543210";
    }

    private Double extractEstimatedYears(String text) {
        if (text == null) return 1.5;
        Pattern pattern = Pattern.compile("(\\d+(\\.\\d+)?)\\+?\\s*(years|yrs)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Double.parseDouble(matcher.group(1));
            } catch (Exception ignored) {}
        }
        return 1.5;
    }
}
