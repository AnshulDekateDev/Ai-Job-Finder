package com.aijobfinder.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_external_id_source", columnList = "externalId, sourceCode", unique = true)
})
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String externalId;

    @Column(nullable = false)
    private String sourceCode; // REMOTEOK, GREENHOUSE, LEVER, GOOGLE_JOBS, INDEED, LINKEDIN, etc.

    @Column(nullable = false)
    private String title;

    private String company;

    private String location;

    private String country;

    private String remoteType; // REMOTE, HYBRID, ON_SITE

    private String salary;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String description;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String requirements;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String skillsJson = "[]"; // ["Java", "Spring Boot", ...]

    private Double minExperienceRequired = 0.0;

    private Double maxExperienceRequired = 5.0;

    @Column(length = 2048)
    private String applicationUrl;

    @Column(length = 2048)
    private String jobUrl;

    private LocalDateTime postedAt;

    private LocalDateTime fetchedAt = LocalDateTime.now();

    public Job() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }

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

    public String getSkillsJson() { return skillsJson; }
    public void setSkillsJson(String skillsJson) { this.skillsJson = skillsJson; }

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

    public LocalDateTime getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(LocalDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
}
