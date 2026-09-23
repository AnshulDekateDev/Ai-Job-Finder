package com.aijobfinder.service;

import com.aijobfinder.entity.Application;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.SavedJob;
import com.aijobfinder.entity.User;
import com.aijobfinder.repository.ApplicationRepository;
import com.aijobfinder.repository.JobRepository;
import com.aijobfinder.repository.SavedJobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            SavedJobRepository savedJobRepository,
            JobRepository jobRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.savedJobRepository = savedJobRepository;
        this.jobRepository = jobRepository;
    }

    @Transactional
    public Application recordApplication(User user, Long jobId, String status, String notes) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));

        Optional<Application> existing = applicationRepository.findByUserAndJob(user, job);
        Application app = existing.orElseGet(Application::new);
        app.setUser(user);
        app.setJob(job);
        app.setStatus(status != null ? status : "APPLICATION_STARTED");
        app.setOriginalApplicationUrl(job.getApplicationUrl());
        if (notes != null) {
            app.setNotes(notes);
        }
        if ("APPLIED".equalsIgnoreCase(status) && app.getAppliedAt() == null) {
            app.setAppliedAt(LocalDateTime.now());
        }
        app.setUpdatedAt(LocalDateTime.now());

        return applicationRepository.save(app);
    }

    public List<Application> getUserApplications(User user) {
        return applicationRepository.findByUserOrderByUpdatedAtDesc(user);
    }

    @Transactional
    public SavedJob toggleSaveJob(User user, Long jobId, String notes) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));

        Optional<SavedJob> existing = savedJobRepository.findByUserAndJob(user, job);
        if (existing.isPresent()) {
            savedJobRepository.delete(existing.get());
            return null;
        } else {
            SavedJob saved = new SavedJob(user, job);
            saved.setNotes(notes);
            return savedJobRepository.save(saved);
        }
    }

    public List<SavedJob> getUserSavedJobs(User user) {
        return savedJobRepository.findByUserOrderBySavedAtDesc(user);
    }
}
