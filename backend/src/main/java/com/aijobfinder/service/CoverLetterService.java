package com.aijobfinder.service;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.CoverLetter;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.User;
import com.aijobfinder.provider.llm.LLMProviderFactory;
import com.aijobfinder.repository.CandidateProfileRepository;
import com.aijobfinder.repository.CoverLetterRepository;
import com.aijobfinder.repository.JobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CoverLetterService {

    private final CoverLetterRepository coverLetterRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final JobRepository jobRepository;
    private final LLMProviderFactory llmProviderFactory;

    public CoverLetterService(
            CoverLetterRepository coverLetterRepository,
            CandidateProfileRepository candidateProfileRepository,
            JobRepository jobRepository,
            LLMProviderFactory llmProviderFactory
    ) {
        this.coverLetterRepository = coverLetterRepository;
        this.candidateProfileRepository = candidateProfileRepository;
        this.jobRepository = jobRepository;
        this.llmProviderFactory = llmProviderFactory;
    }

    @Transactional
    public CoverLetter generateCoverLetter(User user, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));

        CandidateProfile profile = candidateProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Candidate profile not found. Please upload a resume first."));

        LLMProviderFactory.ActiveLLMContext llmContext = llmProviderFactory.resolveActiveContext(user);

        String generatedLetter = llmContext.getProvider().generateCoverLetter(
                profile,
                job,
                llmContext.getDecryptedApiKey(),
                llmContext.getModelName(),
                llmContext.getBaseUrl()
        );

        Optional<CoverLetter> existing = coverLetterRepository.findByUserAndJob(user, job);
        CoverLetter coverLetter = existing.orElseGet(CoverLetter::new);
        coverLetter.setUser(user);
        coverLetter.setJob(job);
        coverLetter.setGeneratedContent(generatedLetter);
        coverLetter.setUserEditedContent(generatedLetter);
        coverLetter.setModelUsed(llmContext.getProviderType() + " (" + llmContext.getModelName() + ")");
        coverLetter.setWordCount(countWords(generatedLetter));
        coverLetter.setUpdatedAt(LocalDateTime.now());

        return coverLetterRepository.save(coverLetter);
    }

    @Transactional
    public CoverLetter updateCoverLetter(User user, Long id, String editedContent) {
        CoverLetter coverLetter = coverLetterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cover letter not found with id: " + id));

        if (!coverLetter.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to cover letter");
        }

        coverLetter.setUserEditedContent(editedContent);
        coverLetter.setWordCount(countWords(editedContent));
        coverLetter.setUpdatedAt(LocalDateTime.now());
        return coverLetterRepository.save(coverLetter);
    }

    public Optional<CoverLetter> getCoverLetterForJob(User user, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));
        return coverLetterRepository.findByUserAndJob(user, job);
    }

    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        return text.trim().split("\\s+").length;
    }
}
