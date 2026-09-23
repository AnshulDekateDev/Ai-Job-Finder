package com.aijobfinder.provider.llm;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Job;

public interface LLMProvider {

    String getProviderType();

    boolean testConnection(String apiKey, String modelName, String baseUrl);

    String generate(String prompt, String apiKey, String modelName, String baseUrl);

    CandidateProfile parseResume(String resumeText, String apiKey, String modelName, String baseUrl);

    MatchAnalysis explainMatch(CandidateProfile profile, Job job, double matchScore, String apiKey, String modelName, String baseUrl);

    String generateCoverLetter(CandidateProfile profile, Job job, String apiKey, String modelName, String baseUrl);

    class MatchAnalysis {
        private String matchSummary;
        private String experienceSummary;
        private String locationSummary;
        private java.util.List<String> matchedSkills;
        private java.util.List<String> missingSkills;

        public MatchAnalysis() {
            this.matchedSkills = new java.util.ArrayList<>();
            this.missingSkills = new java.util.ArrayList<>();
        }

        public MatchAnalysis(String matchSummary, String experienceSummary, String locationSummary, java.util.List<String> matchedSkills, java.util.List<String> missingSkills) {
            this.matchSummary = matchSummary;
            this.experienceSummary = experienceSummary;
            this.locationSummary = locationSummary;
            this.matchedSkills = matchedSkills != null ? matchedSkills : new java.util.ArrayList<>();
            this.missingSkills = missingSkills != null ? missingSkills : new java.util.ArrayList<>();
        }

        public String getMatchSummary() { return matchSummary; }
        public void setMatchSummary(String matchSummary) { this.matchSummary = matchSummary; }

        public String getExperienceSummary() { return experienceSummary; }
        public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }

        public String getLocationSummary() { return locationSummary; }
        public void setLocationSummary(String locationSummary) { this.locationSummary = locationSummary; }

        public java.util.List<String> getMatchedSkills() { return matchedSkills; }
        public void setMatchedSkills(java.util.List<String> matchedSkills) { this.matchedSkills = matchedSkills; }

        public java.util.List<String> getMissingSkills() { return missingSkills; }
        public void setMissingSkills(java.util.List<String> missingSkills) { this.missingSkills = missingSkills; }
    }
}
