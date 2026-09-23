package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_preferences")
public class SearchPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String targetTitlesJson = "[\"Java Developer\", \"Backend Developer\", \"Spring Boot Developer\"]";

    @Lob
    @Column(columnDefinition = "TEXT")
    private String targetLocationsJson = "[\"India\", \"Remote India\", \"Remote Worldwide\"]";

    @Lob
    @Column(columnDefinition = "TEXT")
    private String countriesJson = "[\"India\", \"United States\", \"United Kingdom\", \"Germany\", \"Canada\", \"Australia\"]";

    @Lob
    @Column(columnDefinition = "TEXT")
    private String workModesJson = "[\"REMOTE\", \"HYBRID\", \"ON_SITE\"]";

    private String experienceRange = "0-2 years"; // 0-2 years, 2-5 years, 5+ years

    private Double minMatchPercentage = 60.0;

    private Integer maxResults = 30;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String selectedSourcesJson = "[\"REMOTEOK\", \"GREENHOUSE\", \"LEVER\", \"WE_WORK_REMOTELY\", \"GOOGLE_JOBS\"]";

    private LocalDateTime updatedAt = LocalDateTime.now();

    public SearchPreference() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTargetTitlesJson() { return targetTitlesJson; }
    public void setTargetTitlesJson(String targetTitlesJson) { this.targetTitlesJson = targetTitlesJson; }

    public String getTargetLocationsJson() { return targetLocationsJson; }
    public void setTargetLocationsJson(String targetLocationsJson) { this.targetLocationsJson = targetLocationsJson; }

    public String getCountriesJson() { return countriesJson; }
    public void setCountriesJson(String countriesJson) { this.countriesJson = countriesJson; }

    public String getWorkModesJson() { return workModesJson; }
    public void setWorkModesJson(String workModesJson) { this.workModesJson = workModesJson; }

    public String getExperienceRange() { return experienceRange; }
    public void setExperienceRange(String experienceRange) { this.experienceRange = experienceRange; }

    public Double getMinMatchPercentage() { return minMatchPercentage; }
    public void setMinMatchPercentage(Double minMatchPercentage) { this.minMatchPercentage = minMatchPercentage; }

    public Integer getMaxResults() { return maxResults; }
    public void setMaxResults(Integer maxResults) { this.maxResults = maxResults; }

    public String getSelectedSourcesJson() { return selectedSourcesJson; }
    public void setSelectedSourcesJson(String selectedSourcesJson) { this.selectedSourcesJson = selectedSourcesJson; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
