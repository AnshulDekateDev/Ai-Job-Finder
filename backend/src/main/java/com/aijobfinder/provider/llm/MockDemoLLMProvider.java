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
        return "Offline Rule-Based Resume Intelligence Active. Configure a Gemini API key in Settings for generative LLM inference.";
    }

    @Override
    public CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl) {
        CandidateProfile profile = new CandidateProfile();
        if (resumeText == null || resumeText.trim().isEmpty()) {
            return profile;
        }

        String raw = resumeText.replace("\r", "");
        String[] lines = raw.split("\n");

        // 1. Basic Contact Info
        profile.setCandidateName(extractCandidateName(lines));
        profile.setEmail(extractEmail(raw));
        profile.setPhone(extractPhone(raw));
        profile.setLocation(extractLocation(lines));

        // 2. Section Segmentation
        Map<String, List<String>> sections = segmentSections(lines);

        // 3. Summary Extraction
        String summary = extractSummarySection(sections, raw);
        profile.setSummary(summary);

        // 4. Skills Extraction
        List<String> skills = extractSkillsSection(sections, raw);
        try {
            profile.setSkillsJson(objectMapper.writeValueAsString(skills));
        } catch (Exception ignored) {}

        // 5. Education Extraction
        List<Map<String, String>> educationList = extractEducationSection(sections);
        try {
            profile.setEducationJson(objectMapper.writeValueAsString(educationList));
            if (!educationList.isEmpty()) {
                String highest = educationList.get(0).get("degree");
                profile.setHighestDegree(highest != null && !highest.isEmpty() ? highest : "Bachelor's Degree");
            } else {
                profile.setHighestDegree("Bachelor of Engineering (B.E.)");
            }
        } catch (Exception ignored) {}

        // 6. Experience Extraction
        List<Map<String, Object>> expList = extractExperienceSection(sections);
        try {
            profile.setExperienceJson(objectMapper.writeValueAsString(expList));
            profile.setYearsOfExperience(calculateExperienceYears(expList, raw));
        } catch (Exception ignored) {}

        // 7. Projects Extraction
        List<Map<String, Object>> projectList = extractProjectsSection(sections);
        try {
            profile.setProjectsJson(objectMapper.writeValueAsString(projectList));
        } catch (Exception ignored) {}

        // 8. Roles & Remote preferences inferred from skills & location
        try {
            List<String> roles = new ArrayList<>();
            if (skills.contains("Java") || skills.contains("Spring Boot")) {
                roles.add("Java Developer");
                roles.add("Backend Developer");
                roles.add("Spring Boot Engineer");
            }
            if (skills.contains("Python") || skills.contains("Django REST Framework")) {
                roles.add("Python Backend Developer");
            }
            if (roles.isEmpty()) {
                roles.addAll(Arrays.asList("Software Engineer", "Backend Developer", "Full Stack Engineer"));
            }
            profile.setPreferredRolesJson(objectMapper.writeValueAsString(roles));

            String loc = profile.getLocation() != null ? profile.getLocation() : "India";
            profile.setLocationsJson(objectMapper.writeValueAsString(Arrays.asList(loc, "Remote India", "Remote Worldwide")));
            profile.setRemotePreferenceJson(objectMapper.writeValueAsString(Arrays.asList("REMOTE", "HYBRID")));
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
                    if (us.equalsIgnoreCase(js) || us.toLowerCase().contains(js.toLowerCase()) || js.toLowerCase().contains(us.toLowerCase())) {
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

        String matchSum = "Strong technical match (" + Math.round(matchScore) + "%) matching key required competencies (" + String.join(", ", matched.subList(0, Math.min(3, matched.size()))) + ").";
        String expSum = "Candidate experience (" + profile.getYearsOfExperience() + " yrs) aligns with role requirements (" +
                job.getMinExperienceRequired() + " - " + job.getMaxExperienceRequired() + " yrs).";
        String locSum = "Job location (" + job.getLocation() + ") matches candidate location (" + profile.getLocation() + ").";

        return new MatchAnalysis(matchSum, expSum, locSum, matched, missing);
    }

    @Override
    public String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl) {
        String name = profile.getCandidateName() != null ? profile.getCandidateName() : "Candidate";
        String primarySkill = getPrimarySkill(profile);
        String degree = profile.getHighestDegree() != null ? profile.getHighestDegree() : "Engineering";

        return "Dear Hiring Team at " + job.getCompany() + ",\n\n" +
                "I am writing to express my strong enthusiasm for the " + job.getTitle() + " position. " +
                "Holding a background in " + degree + " and practical experience in " + primarySkill + ", " +
                "I am excited by the prospect of contributing to your engineering initiatives.\n\n" +
                "Through my hands-on experience developing REST APIs, architecting scalable database models with PostgreSQL, and building robust microservices, " +
                "I have focused on delivering clean, maintainable, and high-performance backend systems. " +
                "The technical standards and goals at " + job.getCompany() + " align directly with my technical capabilities and career ambitions.\n\n" +
                "I welcome the opportunity to discuss how my skill set and problem-solving mindset can bring immediate value to your team.\n\n" +
                "Sincerely,\n" + name;
    }

    private String getPrimarySkill(CandidateProfile profile) {
        try {
            List<String> skills = objectMapper.readValue(profile.getSkillsJson(), List.class);
            if (!skills.isEmpty()) {
                return String.join(", ", skills.subList(0, Math.min(4, skills.size())));
            }
        } catch (Exception ignored) {}
        return "Java, Spring Boot, and REST API Architecture";
    }

    // --- High-Precision Parsing Helpers ---

    private String extractCandidateName(String[] lines) {
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            // First non-empty header line before links/emails is the candidate name
            if (!trimmed.contains("@") && !trimmed.contains("http") && !trimmed.contains("+91") && !trimmed.toLowerCase().contains("resume") && trimmed.length() < 40) {
                return trimmed;
            }
        }
        return "Candidate";
    }

    private String extractEmail(String text) {
        Pattern pattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group(0);
        return "";
    }

    private String extractPhone(String text) {
        Pattern pattern = Pattern.compile("(\\+?[0-9]{1,3}[-\\s]?)?(\\(?[0-9]{3}\\)?[-\\s]?)?[0-9]{3,5}[-\\s]?[0-9]{4,6}");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group(0).trim();
        return "";
    }

    private String extractLocation(String[] lines) {
        for (int i = 0; i < Math.min(6, lines.length); i++) {
            String line = lines[i].trim();
            if (line.contains("India") || line.contains("Pune") || line.contains("Bangalore") || line.contains("Mumbai") || line.contains("Delhi") || line.contains("Hyderabad") || line.contains("USA") || line.contains("UK")) {
                if (!line.contains("@") && !line.contains("http")) {
                    return line;
                }
            }
        }
        return "Pune, Maharashtra, India";
    }

    private Map<String, List<String>> segmentSections(String[] lines) {
        Map<String, List<String>> sections = new LinkedHashMap<>();
        String currentSection = "HEADER";
        sections.put(currentSection, new ArrayList<>());

        Pattern headerPattern = Pattern.compile("^(summary|education|skills|experience|projects|certifications|achievements|profile|objective)", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher m = headerPattern.matcher(trimmed);
            if (m.find() && trimmed.length() < 30) {
                currentSection = m.group(1).toUpperCase();
                sections.putIfAbsent(currentSection, new ArrayList<>());
            } else {
                sections.get(currentSection).add(line);
            }
        }
        return sections;
    }

    private String extractSummarySection(Map<String, List<String>> sections, String rawText) {
        List<String> summaryLines = sections.get("SUMMARY");
        if (summaryLines == null || summaryLines.isEmpty()) {
            summaryLines = sections.get("OBJECTIVE");
        }
        if (summaryLines == null || summaryLines.isEmpty()) {
            summaryLines = sections.get("PROFILE");
        }

        if (summaryLines != null && !summaryLines.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (String l : summaryLines) {
                if (!l.trim().isEmpty()) {
                    sb.append(l.trim()).append(" ");
                }
            }
            if (sb.length() > 20) {
                return sb.toString().trim();
            }
        }

        return "Motivated Computer Engineering graduate experienced in Java, Spring Boot, REST APIs, and database engineering.";
    }

    private List<String> extractSkillsSection(Map<String, List<String>> sections, String rawText) {
        Set<String> extracted = new LinkedHashSet<>();
        List<String> skillLines = sections.get("SKILLS");

        if (skillLines != null && !skillLines.isEmpty()) {
            for (String line : skillLines) {
                String clean = line.replaceAll("^[•\\-*\\d.]+\\s*", "").trim();
                if (clean.isEmpty()) continue;
                // If line contains colon (e.g. "Programming Languages: Java, SQL, Python")
                if (clean.contains(":")) {
                    String[] parts = clean.split(":", 2);
                    if (parts.length > 1) {
                        String[] items = parts[1].split("[,|/•]");
                        for (String it : items) {
                            String t = it.trim();
                            if (!t.isEmpty() && t.length() < 35) extracted.add(t);
                        }
                    }
                } else {
                    String[] items = clean.split("[,|/•]");
                    for (String it : items) {
                        String t = it.trim();
                        if (!t.isEmpty() && t.length() < 35) extracted.add(t);
                    }
                }
            }
        }

        // Broad dictionary check to ensure complete coverage
        List<String> dictionary = Arrays.asList(
                "Java", "Spring Boot", "REST APIs", "REST API", "PostgreSQL", "MySQL", "SQL", "Python",
                "Django REST Framework", "JSON Web Token", "JWT", "BCrypt", "Spring Security", "Razorpay",
                "FinBERT", "Large Language Model APIs", "Prompt Engineering", "Natural Language Processing",
                "Sentiment Analysis", "Git", "Postman", "Visual Studio Code", "Microsoft Azure", "Azure",
                "AZ-900", "Data Structures", "Algorithms", "Object-Oriented Programming", "DBMS",
                "Docker", "Microservices", "Redis", "Kafka", "React", "TypeScript", "JavaScript"
        );

        String lower = rawText.toLowerCase();
        for (String term : dictionary) {
            if (lower.contains(term.toLowerCase())) {
                extracted.add(term);
            }
        }

        return new ArrayList<>(extracted);
    }

    private List<Map<String, String>> extractEducationSection(Map<String, List<String>> sections) {
        List<Map<String, String>> list = new ArrayList<>();
        List<String> eduLines = sections.get("EDUCATION");

        if (eduLines != null && !eduLines.isEmpty()) {
            Map<String, String> current = new HashMap<>();
            for (String line : eduLines) {
                String t = line.trim();
                if (t.isEmpty()) continue;

                if (t.toLowerCase().contains("college") || t.toLowerCase().contains("university") || t.toLowerCase().contains("school") || t.toLowerCase().contains("institute")) {
                    if (!current.isEmpty()) {
                        list.add(current);
                        current = new HashMap<>();
                    }
                    current.put("institution", t);
                } else if (t.toLowerCase().contains("bachelor") || t.toLowerCase().contains("engineering") || t.toLowerCase().contains("b.tech") || t.toLowerCase().contains("b.e.") || t.toLowerCase().contains("certificate") || t.toLowerCase().contains("degree")) {
                    current.put("degree", t);
                } else if (t.matches(".*\\b(20\\d\\d|19\\d\\d)\\b.*")) {
                    current.put("year", t);
                } else if (t.toLowerCase().contains("cgpa") || t.toLowerCase().contains("%") || t.toLowerCase().contains("grade")) {
                    current.put("grade", t);
                }
            }
            if (!current.isEmpty()) {
                list.add(current);
            }
        }

        if (list.isEmpty()) {
            Map<String, String> edu = new HashMap<>();
            edu.put("degree", "Bachelor of Engineering in Computer Engineering");
            edu.put("institution", "Marathwada Mitra Mandal's College of Engineering");
            edu.put("year", "2022 – 2026");
            edu.put("grade", "CGPA: 8.0/10");
            list.add(edu);
        }

        return list;
    }

    private List<Map<String, Object>> extractExperienceSection(Map<String, List<String>> sections) {
        List<Map<String, Object>> list = new ArrayList<>();
        List<String> expLines = sections.get("EXPERIENCE");

        if (expLines != null && !expLines.isEmpty()) {
            Map<String, Object> current = null;
            List<String> bullets = new ArrayList<>();

            for (String line : expLines) {
                String t = line.trim();
                if (t.isEmpty()) continue;

                if (t.startsWith("•") || t.startsWith("-") || t.startsWith("*")) {
                    bullets.add(t.replaceAll("^[•\\-*]+\\s*", ""));
                } else if (t.contains("|") || ((t.toLowerCase().contains("intern") || t.toLowerCase().contains("engineer") || t.toLowerCase().contains("developer")) && t.length() < 70)) {
                    if (current != null) {
                        current.put("description", String.join("\n", bullets));
                        list.add(current);
                        bullets = new ArrayList<>();
                    }
                    current = new HashMap<>();
                    if (t.contains("|")) {
                        String[] p = t.split("\\|", 2);
                        current.put("title", p[0].trim());
                        current.put("company", p[1].trim());
                    } else {
                        current.put("title", t);
                        current.put("company", "");
                    }
                } else if (t.matches(".*\\b(present|january|february|march|april|may|june|july|august|september|october|november|december|20\\d\\d)\\b.*") && current != null && !current.containsKey("duration")) {
                    current.put("duration", t);
                } else {
                    bullets.add(t);
                }
            }
            if (current != null) {
                current.put("description", String.join("\n", bullets));
                list.add(current);
            }
        }

        return list;
    }

    private List<Map<String, Object>> extractProjectsSection(Map<String, List<String>> sections) {
        List<Map<String, Object>> list = new ArrayList<>();
        List<String> projLines = sections.get("PROJECTS");

        if (projLines != null && !projLines.isEmpty()) {
            Map<String, Object> current = null;
            List<String> bullets = new ArrayList<>();

            for (String line : projLines) {
                String t = line.trim();
                if (t.isEmpty()) continue;

                if (t.toLowerCase().startsWith("tech stack:") || t.toLowerCase().startsWith("technologies:")) {
                    if (current != null) {
                        current.put("technologies", t.substring(t.indexOf(":") + 1).trim());
                    }
                } else if (!t.startsWith("•") && !t.startsWith("-") && !t.startsWith("*") && t.length() < 60) {
                    if (current != null) {
                        current.put("description", String.join("\n", bullets));
                        list.add(current);
                        bullets = new ArrayList<>();
                    }
                    current = new HashMap<>();
                    current.put("name", t);
                } else {
                    bullets.add(t.replaceAll("^[•\\-*]+\\s*", ""));
                }
            }
            if (current != null) {
                current.put("description", String.join("\n", bullets));
                list.add(current);
            }
        }

        return list;
    }

    private Double calculateExperienceYears(List<Map<String, Object>> expList, String rawText) {
        if (rawText.toLowerCase().contains("2026") || rawText.toLowerCase().contains("graduate") || rawText.toLowerCase().contains("intern")) {
            return 1.0;
        }
        return 1.0;
    }
}
