package com.aijobfinder.source;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class JobData {
    private String externalId;
    private String source;
    private String title;
    private String company;
    private String location;
    private String country;
    private String remoteType; // REMOTE, HYBRID, ON_SITE
    private String salary;
    private String description;
    private String requirements;
    private List<String> skills = new ArrayList<>();
    private Double minExperienceRequired = 0.0;
    private Double maxExperienceRequired = 5.0;
    private String applicationUrl;
    private String jobUrl;
    private LocalDateTime postedAt;

    public JobData() {}

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getRemoteType() { return remoteType; }
    public void setRemoteType(String remoteType) { this.remoteType = remoteType; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public Double getMinExperienceRequired() { return minExperienceRequired; }
    public void setMinExperienceRequired(Double minExperienceRequired) { this.minExperienceRequired = minExperienceRequired; }

    public Double getMaxExperienceRequired() { return maxExperienceRequired; }
    public void setMaxExperienceRequired(Double maxExperienceRequired) { this.maxExperienceRequired = maxExperienceRequired; }

    public String getApplicationUrl() { return applicationUrl; }
    public void setApplicationUrl(String applicationUrl) { this.applicationUrl = applicationUrl; }

    public String getJobUrl() { return jobUrl; }
    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }

    public LocalDateTime getPostedAt() { return postedAt; }
    public void setPostedAt(LocalDateTime postedAt) { this.postedAt = postedAt; }
}
