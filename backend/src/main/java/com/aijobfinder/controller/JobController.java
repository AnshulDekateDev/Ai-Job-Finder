package com.aijobfinder.controller;

import com.aijobfinder.entity.CoverLetter;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.SavedJob;
import com.aijobfinder.repository.JobRepository;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.service.ApplicationService;
import com.aijobfinder.service.CoverLetterService;
import com.aijobfinder.service.JobSearchService;
import com.aijobfinder.source.JobSearchQuery;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobSearchService jobSearchService;
    private final CoverLetterService coverLetterService;
    private final ApplicationService applicationService;
    private final JobRepository jobRepository;

    public JobController(
            JobSearchService jobSearchService,
            CoverLetterService coverLetterService,
            ApplicationService applicationService,
            JobRepository jobRepository
    ) {
        this.jobSearchService = jobSearchService;
        this.coverLetterService = coverLetterService;
        this.applicationService = applicationService;
        this.jobRepository = jobRepository;
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchJobs(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) JobSearchQuery query
    ) {
        JobSearchService.SearchResultResponse response = jobSearchService.executeSearch(userPrincipal.getUser(), query);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getJobDetails(@PathVariable Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + id));
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{id}/cover-letter")
    public ResponseEntity<?> generateCoverLetter(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        try {
            CoverLetter coverLetter = coverLetterService.generateCoverLetter(userPrincipal.getUser(), id);
            return ResponseEntity.ok(coverLetter);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/cover-letters/{id}")
    public ResponseEntity<?> updateCoverLetter(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String content = body.get("content");
        CoverLetter updated = coverLetterService.updateCoverLetter(userPrincipal.getUser(), id, content);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<?> toggleSave(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String notes = body != null ? body.get("notes") : null;
        SavedJob savedJob = applicationService.toggleSaveJob(userPrincipal.getUser(), id, notes);
        boolean isSaved = (savedJob != null);
        return ResponseEntity.ok(Map.of("saved", isSaved, "jobId", id));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<SavedJob>> getSavedJobs(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(applicationService.getUserSavedJobs(userPrincipal.getUser()));
    }
}
