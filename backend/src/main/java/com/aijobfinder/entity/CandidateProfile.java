package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_profiles")
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    @JsonIgnore
    private Resume resume;

    private String candidateName;
    private String email;
    private String phone;
    private String location;
    private Double yearsOfExperience = 0.0;
    private String highestDegree;

    // JSON stored fields
    @Lob
    @Column(columnDefinition = "CLOB")
    private String skillsJson = "[]"; // e.g. ["Java", "Spring Boot", "REST API", "PostgreSQL", "Docker"]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String experienceJson = "[]"; // [{title, company, duration, description, skills}]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String educationJson = "[]"; // [{degree, institution, year}]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String projectsJson = "[]"; // [{name, description, technologies}]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String preferredRolesJson = "[]"; // ["Java Developer", "Backend Developer"]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String locationsJson = "[]"; // ["India", "Remote India", "Remote Worldwide"]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String remotePreferenceJson = "[]"; // ["REMOTE", "HYBRID", "ON_SITE"]

    @Lob
    @Column(columnDefinition = "CLOB")
    private String summary;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public CandidateProfile() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Double yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getHighestDegree() { return highestDegree; }
    public void setHighestDegree(String highestDegree) { this.highestDegree = highestDegree; }

    public String getSkillsJson() { return skillsJson; }
    public void setSkillsJson(String skillsJson) { this.skillsJson = skillsJson; }

    public String getExperienceJson() { return experienceJson; }
    public void setExperienceJson(String experienceJson) { this.experienceJson = experienceJson; }

    public String getEducationJson() { return educationJson; }
    public void setEducationJson(String educationJson) { this.educationJson = educationJson; }

    public String getProjectsJson() { return projectsJson; }
    public void setProjectsJson(String projectsJson) { this.projectsJson = projectsJson; }

    public String getPreferredRolesJson() { return preferredRolesJson; }
    public void setPreferredRolesJson(String preferredRolesJson) { this.preferredRolesJson = preferredRolesJson; }

    public String getLocationsJson() { return locationsJson; }
    public void setLocationsJson(String locationsJson) { this.locationsJson = locationsJson; }

    public String getRemotePreferenceJson() { return remotePreferenceJson; }
    public void setRemotePreferenceJson(String remotePreferenceJson) { this.remotePreferenceJson = remotePreferenceJson; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
