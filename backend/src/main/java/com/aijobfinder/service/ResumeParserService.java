package com.aijobfinder.service;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Resume;
import com.aijobfinder.entity.User;
import com.aijobfinder.provider.llm.LLMProviderFactory;
import com.aijobfinder.repository.CandidateProfileRepository;
import com.aijobfinder.repository.ResumeRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ResumeParserService {

    private static final Logger log = LoggerFactory.getLogger(ResumeParserService.class);

    private final ResumeRepository resumeRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final LLMProviderFactory llmProviderFactory;

    public ResumeParserService(
            ResumeRepository resumeRepository,
            CandidateProfileRepository candidateProfileRepository,
            LLMProviderFactory llmProviderFactory
    ) {
        this.resumeRepository = resumeRepository;
        this.candidateProfileRepository = candidateProfileRepository;
        this.llmProviderFactory = llmProviderFactory;
    }

    @Transactional
    public CandidateProfile processAndSaveResume(User user, MultipartFile file) {
        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
            String rawText = extractText(file.getInputStream(), filename);

            if (rawText == null || rawText.trim().isEmpty()) {
                throw new IllegalArgumentException("Unable to extract text from the uploaded file. Please ensure the file is not empty or scanned as an image.");
            }

            // Save or update Resume record
            Optional<Resume> existingResume = resumeRepository.findByUser(user);
            Resume resume = existingResume.orElseGet(Resume::new);
            resume.setUser(user);
            resume.setFilename(filename);
            resume.setContentType(file.getContentType());
            resume.setFileSize(file.getSize());
            resume.setRawText(rawText);
            resume.setUploadedAt(LocalDateTime.now());
            resume = resumeRepository.save(resume);

            // Parse candidate profile via active user LLM provider
            LLMProviderFactory.ActiveLLMContext llmContext = llmProviderFactory.resolveActiveContext(user);
            CandidateProfile parsedProfile = llmContext.getProvider().parseResume(
                    rawText,
                    llmContext.getDecryptedApiKey(),
                    llmContext.getModelName(),
                    llmContext.getBaseUrl()
            );

            // Save or update CandidateProfile record
            Optional<CandidateProfile> existingProfile = candidateProfileRepository.findByUser(user);
            CandidateProfile profile = existingProfile.orElseGet(CandidateProfile::new);
            profile.setUser(user);
            profile.setResume(resume);
            profile.setCandidateName(parsedProfile.getCandidateName());
            profile.setEmail(parsedProfile.getEmail());
            profile.setPhone(parsedProfile.getPhone());
            profile.setLocation(parsedProfile.getLocation());
            profile.setYearsOfExperience(parsedProfile.getYearsOfExperience());
            profile.setHighestDegree(parsedProfile.getHighestDegree());
            profile.setSummary(parsedProfile.getSummary());
            profile.setSkillsJson(parsedProfile.getSkillsJson());
            profile.setExperienceJson(parsedProfile.getExperienceJson());
            profile.setEducationJson(parsedProfile.getEducationJson());
            profile.setProjectsJson(parsedProfile.getProjectsJson());
            profile.setPreferredRolesJson(parsedProfile.getPreferredRolesJson());
            profile.setLocationsJson(parsedProfile.getLocationsJson());
            profile.setRemotePreferenceJson(parsedProfile.getRemotePreferenceJson());
            profile.setUpdatedAt(LocalDateTime.now());

            return candidateProfileRepository.save(profile);
        } catch (Exception e) {
            log.error("Failed processing resume: {}", e.getMessage(), e);
            throw new RuntimeException("Error processing resume: " + e.getMessage(), e);
        }
    }

    public String extractText(InputStream inputStream, String filename) throws Exception {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            try (PDDocument document = PDDocument.load(inputStream)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if (lower.endsWith(".docx")) {
            try (XWPFDocument doc = new XWPFDocument(inputStream);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        } else {
            // Default plain text read
            byte[] bytes = inputStream.readAllBytes();
            return new String(bytes);
        }
    }
}
