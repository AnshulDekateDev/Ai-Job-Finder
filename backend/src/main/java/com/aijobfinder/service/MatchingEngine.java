package com.aijobfinder.service;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.JobMatch;
import com.aijobfinder.entity.User;
import com.aijobfinder.provider.llm.LLMProvider;
import com.aijobfinder.provider.llm.LLMProviderFactory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class MatchingEngine {

    private static final Logger log = LoggerFactory.getLogger(MatchingEngine.class);

    // Configurable weights (total = 100%)
    private static final double WEIGHT_SKILLS = 0.40;
    private static final double WEIGHT_EXPERIENCE = 0.20;
    private static final double WEIGHT_TITLE = 0.15;
    private static final double WEIGHT_LOCATION = 0.10;
    private static final double WEIGHT_EDUCATION = 0.05;
    private static final double WEIGHT_PROJECTS = 0.10;

    private final ObjectMapper objectMapper;
    private final LLMProviderFactory llmProviderFactory;

    public MatchingEngine(ObjectMapper objectMapper, LLMProviderFactory llmProviderFactory) {
        this.objectMapper = objectMapper;
        this.llmProviderFactory = llmProviderFactory;
    }

    public JobMatch calculateMatch(User user, CandidateProfile profile, Job job, boolean invokeLlmExplanation) {
        JobMatch match = new JobMatch();
        match.setUser(user);
        match.setJob(job);
        match.setComputedAt(LocalDateTime.now());

        List<String> candidateSkills = parseJsonList(profile.getSkillsJson());
        List<String> jobSkills = parseJsonList(job.getSkillsJson());

        // 1. Skills Score (40%)
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        double skillsScore = computeSkillsScore(candidateSkills, jobSkills, job.getDescription(), matchedSkills, missingSkills);
        match.setSkillsScore(skillsScore);

        // 2. Experience Score (20%)
        double expScore = computeExperienceScore(profile.getYearsOfExperience(), job.getMinExperienceRequired(), job.getMaxExperienceRequired());
        match.setExperienceScore(expScore);

        // 3. Title Similarity Score (15%)
        List<String> preferredRoles = parseJsonList(profile.getPreferredRolesJson());
        double titleScore = computeTitleScore(preferredRoles, job.getTitle());
        match.setTitleScore(titleScore);

        // 4. Location / Work Mode Score (10%)
        List<String> candidateLocations = parseJsonList(profile.getLocationsJson());
        List<String> remotePrefs = parseJsonList(profile.getRemotePreferenceJson());
        double locationScore = computeLocationScore(candidateLocations, remotePrefs, job.getLocation(), job.getRemoteType(), job.getCountry());
        match.setLocationScore(locationScore);

        // 5. Education Score (5%)
        double eduScore = computeEducationScore(profile.getHighestDegree(), job.getDescription());
        match.setEducationScore(eduScore);

        // 6. Projects Score (10%)
        double projectsScore = computeProjectsScore(profile.getProjectsJson(), jobSkills);
        match.setProjectsScore(projectsScore);

        // Weighted Overall Score
        double overallPercentage = (skillsScore * WEIGHT_SKILLS) +
                (expScore * WEIGHT_EXPERIENCE) +
                (titleScore * WEIGHT_TITLE) +
                (locationScore * WEIGHT_LOCATION) +
                (eduScore * WEIGHT_EDUCATION) +
                (projectsScore * WEIGHT_PROJECTS);

        overallPercentage = Math.min(99.0, Math.max(25.0, Math.round(overallPercentage * 10.0) / 10.0));
        match.setMatchPercentage(overallPercentage);

        try {
            match.setMatchedSkillsJson(objectMapper.writeValueAsString(matchedSkills));
            match.setMissingSkillsJson(objectMapper.writeValueAsString(missingSkills));
        } catch (Exception ignored) {}

        // LLM Explanation if requested
        if (invokeLlmExplanation) {
            try {
                LLMProviderFactory.ActiveLLMContext llm = llmProviderFactory.resolveActiveContext(user);
                LLMProvider.MatchAnalysis analysis = llm.getProvider().explainMatch(
                        profile, job, overallPercentage, llm.getDecryptedApiKey(), llm.getModelName(), llm.getBaseUrl()
                );
                match.setMatchSummary(analysis.getMatchSummary());
                match.setExperienceSummary(analysis.getExperienceSummary());
                match.setLocationSummary(analysis.getLocationSummary());
                if (!analysis.getMatchedSkills().isEmpty()) {
                    match.setMatchedSkillsJson(objectMapper.writeValueAsString(analysis.getMatchedSkills()));
                }
                if (!analysis.getMissingSkills().isEmpty()) {
                    match.setMissingSkillsJson(objectMapper.writeValueAsString(analysis.getMissingSkills()));
                }
            } catch (Exception e) {
                log.warn("LLM explanation generation skipped: {}", e.getMessage());
                setDefaultExplanations(match, overallPercentage, matchedSkills, missingSkills, profile, job);
            }
        } else {
            setDefaultExplanations(match, overallPercentage, matchedSkills, missingSkills, profile, job);
        }

        return match;
    }

    private void setDefaultExplanations(JobMatch match, double score, List<String> matched, List<String> missing, CandidateProfile profile, Job job) {
        String matchWhy = "Strong alignment (" + Math.round(score) + "%) with key technical requirements" +
                (matched.isEmpty() ? "." : " including " + String.join(", ", matched.subList(0, Math.min(4, matched.size()))) + ".");
        match.setMatchSummary(matchWhy);

        String missingWhy = missing.isEmpty() ? "No critical skill gaps identified." :
                "Skills not explicitly found in resume: " + String.join(", ", missing.subList(0, Math.min(3, missing.size()))) + ".";

        match.setExperienceSummary("Job targets " + job.getMinExperienceRequired() + " - " + job.getMaxExperienceRequired() +
                " yrs. Candidate profile indicates " + (profile.getYearsOfExperience() != null ? profile.getYearsOfExperience() : 1.0) + " yrs.");

        match.setLocationSummary("Job is " + job.getRemoteType() + " in " + job.getLocation() + ", compatible with candidate preferences.");
    }

    private double computeSkillsScore(List<String> candidateSkills, List<String> jobSkills, String description, List<String> matched, List<String> missing) {
        if (jobSkills == null || jobSkills.isEmpty()) {
            // Extract from description or provide default baseline
            jobSkills = Arrays.asList("Java", "Spring Boot", "REST API", "SQL");
        }

        int totalRequired = jobSkills.size();
        int matchedCount = 0;

        for (String req : jobSkills) {
            boolean has = false;
            for (String cand : candidateSkills) {
                if (cand.equalsIgnoreCase(req) || cand.toLowerCase().contains(req.toLowerCase()) || req.toLowerCase().contains(cand.toLowerCase())) {
                    has = true;
                    break;
                }
            }
            if (has) {
                matchedCount++;
                if (!matched.contains(req)) matched.add(req);
            } else {
                if (!missing.contains(req)) missing.add(req);
            }
        }

        double ratio = (double) matchedCount / Math.max(1, totalRequired);
        return Math.min(100.0, ratio * 100.0);
    }

    private double computeExperienceScore(Double candidateYears, Double minReq, Double maxReq) {
        double candY = candidateYears != null ? candidateYears : 1.0;
        double min = minReq != null ? minReq : 0.0;
        double max = maxReq != null ? maxReq : 5.0;

        if (candY >= min && candY <= max) {
            return 100.0;
        } else if (candY < min) {
            double diff = min - candY;
            return Math.max(40.0, 100.0 - (diff * 25.0));
        } else {
            // Overqualified slightly
            return 90.0;
        }
    }

    private double computeTitleScore(List<String> preferredRoles, String jobTitle) {
        if (jobTitle == null || jobTitle.trim().isEmpty()) return 70.0;
        if (preferredRoles == null || preferredRoles.isEmpty()) return 80.0;

        String jLower = jobTitle.toLowerCase();
        double best = 50.0;
        for (String role : preferredRoles) {
            String rLower = role.toLowerCase();
            if (jLower.contains(rLower) || rLower.contains(jLower)) {
                return 100.0;
            }
            // Check word overlaps
            String[] words = rLower.split("\\s+");
            int matches = 0;
            for (String w : words) {
                if (w.length() > 2 && jLower.contains(w)) matches++;
            }
            double score = (double) matches / Math.max(1, words.length) * 90.0;
            if (score > best) best = score;
        }
        return Math.max(50.0, best);
    }

    private double computeLocationScore(List<String> preferredLocs, List<String> remotePrefs, String jobLoc, String remoteType, String country) {
        if ("REMOTE".equalsIgnoreCase(remoteType)) {
            return 100.0;
        }
        if (jobLoc == null) return 75.0;
        String lowerLoc = jobLoc.toLowerCase();
        for (String pref : preferredLocs) {
            if (lowerLoc.contains(pref.toLowerCase()) || pref.toLowerCase().contains("worldwide")) {
                return 100.0;
            }
        }
        return 70.0;
    }

    private double computeEducationScore(String highestDegree, String description) {
        if (highestDegree == null || highestDegree.isEmpty()) return 80.0;
        return 95.0;
    }

    private double computeProjectsScore(String projectsJson, List<String> jobSkills) {
        if (projectsJson == null || projectsJson.equals("[]") || projectsJson.isEmpty()) return 70.0;
        return 90.0;
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.trim().isEmpty() || json.equals("[]")) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
