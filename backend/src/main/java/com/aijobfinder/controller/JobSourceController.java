package com.aijobfinder.controller;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.ScraperProviderFactory;
import com.aijobfinder.repository.JobSourceConfigRepository;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.source.JobSourceAdapter;
import com.aijobfinder.source.JobSourceRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-sources")
public class JobSourceController {

    private final JobSourceConfigRepository jobSourceConfigRepository;
    private final JobSourceRegistry jobSourceRegistry;
    private final ScraperProviderFactory scraperProviderFactory;

    public JobSourceController(
            JobSourceConfigRepository jobSourceConfigRepository,
            JobSourceRegistry jobSourceRegistry,
            ScraperProviderFactory scraperProviderFactory
    ) {
        this.jobSourceConfigRepository = jobSourceConfigRepository;
        this.jobSourceRegistry = jobSourceRegistry;
        this.scraperProviderFactory = scraperProviderFactory;
    }

    @GetMapping
    public ResponseEntity<List<JobSourceConfig>> getJobSources(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(jobSourceConfigRepository.findByUser(userPrincipal.getUser()));
    }

    @PostMapping
    public ResponseEntity<?> addOrUpdateJobSource(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody JobSourceConfig req
    ) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Source name is required"));
        }

        JobSourceConfig config;
        if (req.getId() != null) {
            config = jobSourceConfigRepository.findByIdAndUser(req.getId(), userPrincipal.getUser())
                    .orElseThrow(() -> new IllegalArgumentException("Job source config not found with id: " + req.getId()));
        } else {
            config = new JobSourceConfig();
            config.setUser(userPrincipal.getUser());
            config.setCode(req.getCode() != null ? req.getCode().toUpperCase() : "CUSTOM_" + System.currentTimeMillis());
            config.setCustom(true);
        }

        config.setName(req.getName());
        config.setBaseUrl(req.getBaseUrl());
        config.setSearchUrlPattern(req.getSearchUrlPattern());
        config.setAccessMethod(req.getAccessMethod() != null ? req.getAccessMethod() : "DIRECT_PUBLIC_FEED");
        config.setScraperProviderRef(req.getScraperProviderRef());
        config.setEnabled(req.isEnabled());
        config.setSearchParamMappingJson(req.getSearchParamMappingJson());
        config.setStatus(req.getStatus() != null ? req.getStatus() : "READY");
        config.setUpdatedAt(LocalDateTime.now());

        JobSourceConfig saved = jobSourceConfigRepository.save(config);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleJobSource(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        JobSourceConfig config = jobSourceConfigRepository.findByIdAndUser(id, userPrincipal.getUser())
                .orElseThrow(() -> new IllegalArgumentException("Job source not found"));
        config.setEnabled(!config.isEnabled());
        config.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(jobSourceConfigRepository.save(config));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<?> testJobSource(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        JobSourceConfig config = jobSourceConfigRepository.findByIdAndUser(id, userPrincipal.getUser())
                .orElseThrow(() -> new IllegalArgumentException("Job source not found"));

        ScraperProviderFactory.ActiveScraperContext scraperContext = scraperProviderFactory.resolveActiveContext(userPrincipal.getUser());
        JobSourceAdapter adapter = jobSourceRegistry.getAdapter(config.getCode());

        JobSourceAdapter.SourceAccessStatus accessStatus = adapter.checkAccessStatus(
                config, scraperContext.getProvider(), scraperContext.getDecryptedApiKey()
        );

        config.setStatus(accessStatus.getStatus());
        config.setStatusMessage(accessStatus.getMessage());
        config.setLastTestedAt(LocalDateTime.now());
        jobSourceConfigRepository.save(config);

        Map<String, Object> res = new HashMap<>();
        res.put("status", accessStatus.getStatus());
        res.put("accessible", accessStatus.isAccessible());
        res.put("message", accessStatus.getMessage());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteJobSource(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        JobSourceConfig config = jobSourceConfigRepository.findByIdAndUser(id, userPrincipal.getUser())
                .orElseThrow(() -> new IllegalArgumentException("Job source not found"));
        jobSourceConfigRepository.delete(config);
        return ResponseEntity.ok(Map.of("message", "Job source deleted successfully"));
    }
}
