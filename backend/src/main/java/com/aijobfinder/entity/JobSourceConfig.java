package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_source_configs")
public class JobSourceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String name; // e.g. "Google Jobs", "Greenhouse", "RemoteOK"

    @Column(nullable = false)
    private String code; // GOOGLE_JOBS, INDEED, LINKEDIN, GREENHOUSE, LEVER, REMOTEOK, WE_WORK_REMOTELY, WELLFOUND, CUSTOM

    private String baseUrl;

    private String searchUrlPattern; // e.g. https://example.com/jobs?q={query}&loc={location}

    private String accessMethod = "DIRECT_PUBLIC_FEED"; // DIRECT_PUBLIC_FEED, SCRAPER_PROVIDER, OFFICIAL_API

    private String scraperProviderRef; // ScraperAPI, BrightData, etc.

    private boolean isEnabled = true;

    private boolean isCustom = false;

    @Column(length = 2000)
    private String searchParamMappingJson;

    private String status = "READY"; // READY, NEEDS_CONFIG, UNAVAILABLE, BLOCKED

    private String statusMessage;

    private LocalDateTime lastTestedAt;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public JobSourceConfig() {}

    public JobSourceConfig(User user, String name, String code, String baseUrl, String accessMethod, boolean isEnabled, boolean isCustom, String status, String statusMessage) {
        this.user = user;
        this.name = name;
        this.code = code;
        this.baseUrl = baseUrl;
        this.accessMethod = accessMethod;
        this.isEnabled = isEnabled;
        this.isCustom = isCustom;
        this.status = status;
        this.statusMessage = statusMessage;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getSearchUrlPattern() { return searchUrlPattern; }
    public void setSearchUrlPattern(String searchUrlPattern) { this.searchUrlPattern = searchUrlPattern; }

    public String getAccessMethod() { return accessMethod; }
    public void setAccessMethod(String accessMethod) { this.accessMethod = accessMethod; }

    public String getScraperProviderRef() { return scraperProviderRef; }
    public void setScraperProviderRef(String scraperProviderRef) { this.scraperProviderRef = scraperProviderRef; }

    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }

    public boolean isCustom() { return isCustom; }
    public void setCustom(boolean custom) { isCustom = custom; }

    public String getSearchParamMappingJson() { return searchParamMappingJson; }
    public void setSearchParamMappingJson(String searchParamMappingJson) { this.searchParamMappingJson = searchParamMappingJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }

    public LocalDateTime getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(LocalDateTime lastTestedAt) { this.lastTestedAt = lastTestedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
