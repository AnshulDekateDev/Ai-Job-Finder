package com.aijobfinder.controller;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Resume;
import com.aijobfinder.repository.CandidateProfileRepository;
import com.aijobfinder.repository.ResumeRepository;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.service.ResumeParserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeParserService resumeParserService;
    private final CandidateProfileRepository candidateProfileRepository;
    private final ResumeRepository resumeRepository;

    public ResumeController(
            ResumeParserService resumeParserService,
            CandidateProfileRepository candidateProfileRepository,
            ResumeRepository resumeRepository
    ) {
        this.resumeParserService = resumeParserService;
        this.candidateProfileRepository = candidateProfileRepository;
        this.resumeRepository = resumeRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload a valid non-empty file (PDF or DOCX)."));
        }

        try {
            CandidateProfile profile = resumeParserService.processAndSaveResume(userPrincipal.getUser(), file);
            Map<String, Object> res = new HashMap<>();
            res.put("message", "Resume uploaded and processed successfully");
            res.put("profile", profile);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCandidateProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUser(userPrincipal.getUser());
        Optional<Resume> resumeOpt = resumeRepository.findByUser(userPrincipal.getUser());

        Map<String, Object> res = new HashMap<>();
        res.put("hasResume", resumeOpt.isPresent());
        res.put("resumeFilename", resumeOpt.map(Resume::getFilename).orElse(null));
        res.put("profile", profileOpt.orElse(null));
        return ResponseEntity.ok(res);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateCandidateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody CandidateProfile req
    ) {
        Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUser(userPrincipal.getUser());
        CandidateProfile profile = profileOpt.orElseGet(() -> {
            CandidateProfile p = new CandidateProfile();
            p.setUser(userPrincipal.getUser());
            return p;
        });

        if (req.getCandidateName() != null) profile.setCandidateName(req.getCandidateName());
        if (req.getEmail() != null) profile.setEmail(req.getEmail());
        if (req.getPhone() != null) profile.setPhone(req.getPhone());
        if (req.getLocation() != null) profile.setLocation(req.getLocation());
        if (req.getYearsOfExperience() != null) profile.setYearsOfExperience(req.getYearsOfExperience());
        if (req.getHighestDegree() != null) profile.setHighestDegree(req.getHighestDegree());
        if (req.getSummary() != null) profile.setSummary(req.getSummary());

        if (req.getSkillsJson() != null) profile.setSkillsJson(req.getSkillsJson());
        if (req.getExperienceJson() != null) profile.setExperienceJson(req.getExperienceJson());
        if (req.getEducationJson() != null) profile.setEducationJson(req.getEducationJson());
        if (req.getProjectsJson() != null) profile.setProjectsJson(req.getProjectsJson());
        if (req.getPreferredRolesJson() != null) profile.setPreferredRolesJson(req.getPreferredRolesJson());
        if (req.getLocationsJson() != null) profile.setLocationsJson(req.getLocationsJson());
        if (req.getRemotePreferenceJson() != null) profile.setRemotePreferenceJson(req.getRemotePreferenceJson());

        profile.setUpdatedAt(LocalDateTime.now());
        CandidateProfile saved = candidateProfileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }
}
