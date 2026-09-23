package com.aijobfinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scraper_credentials")
public class ScraperCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String providerType; // SCRAPER_API, BRIGHT_DATA, APIFY, DIRECT_FEED, CUSTOM

    @Column(length = 1024)
    @JsonIgnore
    private String encryptedApiKey;

    private String baseUrl;

    private boolean isDefault = true;

    private boolean isActive = true;

    private String status = "UNTESTED"; // READY, INVALID_KEY, UNTESTED, ERROR

    private String lastStatusMessage;

    private LocalDateTime lastTestedAt;

    private LocalDateTime updatedAt = LocalDateTime.now();

    @Transient
    private String maskedApiKey;

    public ScraperCredential() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }

    public String getEncryptedApiKey() { return encryptedApiKey; }
    public void setEncryptedApiKey(String encryptedApiKey) { this.encryptedApiKey = encryptedApiKey; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLastStatusMessage() { return lastStatusMessage; }
    public void setLastStatusMessage(String lastStatusMessage) { this.lastStatusMessage = lastStatusMessage; }

    public LocalDateTime getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(LocalDateTime lastTestedAt) { this.lastTestedAt = lastTestedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getMaskedApiKey() { return maskedApiKey; }
    public void setMaskedApiKey(String maskedApiKey) { this.maskedApiKey = maskedApiKey; }
}
