package com.aijobfinder.source;

import java.util.ArrayList;
import java.util.List;

public class JobSearchQuery {
    private List<String> titles = new ArrayList<>();
    private List<String> locations = new ArrayList<>();
    private List<String> countries = new ArrayList<>();
    private List<String> workModes = new ArrayList<>(); // REMOTE, HYBRID, ON_SITE
    private String experienceRange = "0-2 years";
    private Double minMatchPercentage = 60.0;
    private int maxResults = 30;
    private List<String> candidateSkills = new ArrayList<>();

    public JobSearchQuery() {}

    public List<String> getTitles() { return titles; }
    public void setTitles(List<String> titles) { this.titles = titles; }

    public List<String> getLocations() { return locations; }
    public void setLocations(List<String> locations) { this.locations = locations; }

    public List<String> getCountries() { return countries; }
    public void setCountries(List<String> countries) { this.countries = countries; }

    public List<String> getWorkModes() { return workModes; }
    public void setWorkModes(List<String> workModes) { this.workModes = workModes; }

    public String getExperienceRange() { return experienceRange; }
    public void setExperienceRange(String experienceRange) { this.experienceRange = experienceRange; }

    public Double getMinMatchPercentage() { return minMatchPercentage; }
    public void setMinMatchPercentage(Double minMatchPercentage) { this.minMatchPercentage = minMatchPercentage; }

    public int getMaxResults() { return maxResults; }
    public void setMaxResults(int maxResults) { this.maxResults = maxResults; }

    public List<String> getCandidateSkills() { return candidateSkills; }
    public void setCandidateSkills(List<String> candidateSkills) { this.candidateSkills = candidateSkills; }
}
