package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "job_id"})
})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(nullable = false)
    private String status = "DISCOVERED"; // DISCOVERED, MATCHED, SAVED, APPLICATION_STARTED, APPLIED, REJECTED, INTERVIEW

    private String originalApplicationUrl;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String notes;

    private LocalDateTime appliedAt;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Application() {}

    public Application(User user, Job job, String status, String originalApplicationUrl) {
        this.user = user;
        this.job = job;
        this.status = status;
        this.originalApplicationUrl = originalApplicationUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOriginalApplicationUrl() { return originalApplicationUrl; }
    public void setOriginalApplicationUrl(String originalApplicationUrl) { this.originalApplicationUrl = originalApplicationUrl; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
