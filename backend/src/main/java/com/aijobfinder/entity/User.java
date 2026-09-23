package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    private String role = "ROLE_USER";

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AiProviderCredential> aiCredentials = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ScraperCredential> scraperCredentials = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<JobSourceConfig> jobSources = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Resume resume;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private CandidateProfile candidateProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private SearchPreference searchPreference;

    public User() {}

    public User(String email, String passwordHash, String fullName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<AiProviderCredential> getAiCredentials() { return aiCredentials; }
    public void setAiCredentials(List<AiProviderCredential> aiCredentials) { this.aiCredentials = aiCredentials; }

    public List<ScraperCredential> getScraperCredentials() { return scraperCredentials; }
    public void setScraperCredentials(List<ScraperCredential> scraperCredentials) { this.scraperCredentials = scraperCredentials; }

    public List<JobSourceConfig> getJobSources() { return jobSources; }
    public void setJobSources(List<JobSourceConfig> jobSources) { this.jobSources = jobSources; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public CandidateProfile getCandidateProfile() { return candidateProfile; }
    public void setCandidateProfile(CandidateProfile candidateProfile) { this.candidateProfile = candidateProfile; }

    public SearchPreference getSearchPreference() { return searchPreference; }
    public void setSearchPreference(SearchPreference searchPreference) { this.searchPreference = searchPreference; }
}
