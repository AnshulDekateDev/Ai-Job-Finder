package com.aijobfinder.service;

import com.aijobfinder.entity.*;
import com.aijobfinder.provider.scraper.ScraperProviderFactory;
import com.aijobfinder.repository.*;
import com.aijobfinder.source.JobData;
import com.aijobfinder.source.JobSearchQuery;
import com.aijobfinder.source.JobSourceRegistry;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobSearchService {

    private static final Logger log = LoggerFactory.getLogger(JobSearchService.class);

    private final JobSourceConfigRepository jobSourceConfigRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final SearchPreferenceRepository searchPreferenceRepository;
    private final JobRepository jobRepository;
    private final JobMatchRepository jobMatchRepository;
    private final SavedJobRepository savedJobRepository;
    private final ApplicationRepository applicationRepository;
    private final ScraperProviderFactory scraperProviderFactory;
    private final JobSourceRegistry jobSourceRegistry;
    private final MatchingEngine matchingEngine;
    private final ObjectMapper objectMapper;

    public JobSearchService(
            JobSourceConfigRepository jobSourceConfigRepository,
            CandidateProfileRepository candidateProfileRepository,
            SearchPreferenceRepository searchPreferenceRepository,
            JobRepository jobRepository,
            JobMatchRepository jobMatchRepository,
            SavedJobRepository savedJobRepository,
            ApplicationRepository applicationRepository,
            ScraperProviderFactory scraperProviderFactory,
            JobSourceRegistry jobSourceRegistry,
            MatchingEngine matchingEngine,
            ObjectMapper objectMapper
    ) {
        this.jobSourceConfigRepository = jobSourceConfigRepository;
        this.candidateProfileRepository = candidateProfileRepository;
        this.searchPreferenceRepository = searchPreferenceRepository;
        this.jobRepository = jobRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.savedJobRepository = savedJobRepository;
        this.applicationRepository = applicationRepository;
        this.scraperProviderFactory = scraperProviderFactory;
        this.jobSourceRegistry = jobSourceRegistry;
        this.matchingEngine = matchingEngine;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SearchResultResponse executeSearch(User user, JobSearchQuery customQuery) {
        // 1. Load Candidate Profile
        Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUser(user);
        CandidateProfile profile = profileOpt.orElseGet(() -> createDefaultProfile(user));

        // 2. Build or resolve search query
        JobSearchQuery query = resolveQuery(user, customQuery, profile);

        // 3. Load active Scraper Provider
        ScraperProviderFactory.ActiveScraperContext scraperContext = scraperProviderFactory.resolveActiveContext(user);

        // 4. Load enabled Job Sources
        List<JobSourceConfig> userSources = jobSourceConfigRepository.findByUserAndIsEnabledTrue(user);
        if (userSources.isEmpty()) {
            userSources = jobSourceConfigRepository.findByUser(user);
        }

        // Filter by query selected sources if specified
        List<JobSourceConfig> selectedSources = filterSelectedSources(userSources, query);

        List<SourceProgressItem> progressLog = new ArrayList<>();

        // 5. Query selected sources in parallel
        List<JobData> rawJobs = jobSourceRegistry.searchAll(
                selectedSources,
                query,
                scraperContext.getProvider(),
                scraperContext.getDecryptedApiKey(),
                new JobSourceRegistry.SearchProgressListener() {
                    @Override
                    public void onSourceStarted(String sourceName) {
                        progressLog.add(new SourceProgressItem(sourceName, "Searching...", 0, "IN_PROGRESS"));
                    }

                    @Override
                    public void onSourceCompleted(String sourceName, int jobsFound) {
                        progressLog.add(new SourceProgressItem(sourceName, "Found " + jobsFound + " jobs", jobsFound, "COMPLETED"));
                    }

                    @Override
                    public void onSourceError(String sourceName, String reason) {
                        progressLog.add(new SourceProgressItem(sourceName, "Unable to access: " + reason, 0, "ERROR"));
                    }
                }
        );

        // 6. Deduplicate & Normalize
        Map<String, JobData> deduplicated = new HashMap<>();
        for (JobData data : rawJobs) {
            String dedupeKey = normalizeString(data.getCompany()) + "|" + normalizeString(data.getTitle());
            if (!deduplicated.containsKey(dedupeKey)) {
                deduplicated.put(dedupeKey, data);
            }
        }

        // 7. Match & Score against candidate profile
        List<JobMatchResult> evaluatedMatches = new ArrayList<>();
        int evaluatedCount = 0;

        for (JobData data : deduplicated.values()) {
            // Save or fetch persistent Job entity
            Job job = persistJob(data);

            // Compute match (only invoke LLM for top candidates to optimize speed)
            boolean invokeLlm = evaluatedCount < 10;
            JobMatch match = matchingEngine.calculateMatch(user, profile, job, invokeLlm);
            evaluatedCount++;

            if (match.getMatchPercentage() >= query.getMinMatchPercentage()) {
                evaluatedMatches.add(new JobMatchResult(job, match));
            }
        }

        // 8. Rank by match percentage descending and cap to top 30
        evaluatedMatches.sort((a, b) -> Double.compare(b.getJobMatch().getMatchPercentage(), a.getJobMatch().getMatchPercentage()));

        int maxLimit = Math.min(30, query.getMaxResults() > 0 ? query.getMaxResults() : 30);
        List<JobMatchResult> topMatches = evaluatedMatches.stream()
                .limit(maxLimit)
                .collect(Collectors.toList());

        // 9. Persist matches in DB for current user
        jobMatchRepository.deleteByUser(user);
        for (JobMatchResult res : topMatches) {
            jobMatchRepository.save(res.getJobMatch());
        }

        // 10. Enrich with saved & application status flags
        List<SavedJob> savedList = savedJobRepository.findByUserOrderBySavedAtDesc(user);
        Set<Long> savedJobIds = savedList.stream().map(s -> s.getJob().getId()).collect(Collectors.toSet());

        List<Application> appList = applicationRepository.findByUserOrderByUpdatedAtDesc(user);
        Map<Long, Application> appMap = appList.stream().collect(Collectors.toMap(a -> a.getJob().getId(), a -> a, (k1, k2) -> k1));

        for (JobMatchResult res : topMatches) {
            res.setSaved(savedJobIds.contains(res.getJob().getId()));
            if (appMap.containsKey(res.getJob().getId())) {
                res.setApplicationStatus(appMap.get(res.getJob().getId()).getStatus());
            } else {
                res.setApplicationStatus("DISCOVERED");
            }
        }

        return new SearchResultResponse(
                topMatches,
                rawJobs.size(),
                deduplicated.size(),
                topMatches.size(),
                progressLog
        );
    }

    private Job persistJob(JobData data) {
        Optional<Job> existing = jobRepository.findByExternalIdAndSourceCode(data.getExternalId(), data.getSource());
        Job job = existing.orElseGet(Job::new);
        job.setExternalId(data.getExternalId());
        job.setSourceCode(data.getSource());
        job.setTitle(data.getTitle());
        job.setCompany(data.getCompany());
        job.setLocation(data.getLocation());
        job.setCountry(data.getCountry());
        job.setRemoteType(data.getRemoteType());
        job.setSalary(data.getSalary());
        job.setDescription(data.getDescription());
        job.setRequirements(data.getRequirements());
        try {
            job.setSkillsJson(objectMapper.writeValueAsString(data.getSkills()));
        } catch (Exception ignored) {}
        job.setMinExperienceRequired(data.getMinExperienceRequired());
        job.setMaxExperienceRequired(data.getMaxExperienceRequired());
        job.setApplicationUrl(data.getApplicationUrl());
        job.setJobUrl(data.getJobUrl());
        job.setPostedAt(data.getPostedAt() != null ? data.getPostedAt() : LocalDateTime.now());
        job.setFetchedAt(LocalDateTime.now());
        return jobRepository.save(job);
    }

    private JobSearchQuery resolveQuery(User user, JobSearchQuery customQuery, CandidateProfile profile) {
        if (customQuery != null && customQuery.getTitles() != null && !customQuery.getTitles().isEmpty()) {
            return customQuery;
        }

        JobSearchQuery q = new JobSearchQuery();
        Optional<SearchPreference> prefOpt = searchPreferenceRepository.findByUser(user);
        if (prefOpt.isPresent()) {
            SearchPreference pref = prefOpt.get();
            q.setTitles(parseJsonList(pref.getTargetTitlesJson()));
            q.setLocations(parseJsonList(pref.getTargetLocationsJson()));
            q.setCountries(parseJsonList(pref.getCountriesJson()));
            q.setWorkModes(parseJsonList(pref.getWorkModesJson()));
            q.setExperienceRange(pref.getExperienceRange());
            q.setMinMatchPercentage(pref.getMinMatchPercentage());
            q.setMaxResults(pref.getMaxResults());
        } else {
            q.setTitles(Arrays.asList("Java Developer", "Backend Developer", "Spring Boot Developer"));
            q.setLocations(Arrays.asList("India", "Remote India", "Remote Worldwide"));
            q.setCountries(Arrays.asList("India", "United States", "United Kingdom", "Germany"));
            q.setWorkModes(Arrays.asList("REMOTE", "HYBRID"));
            q.setExperienceRange("0-2 years");
            q.setMinMatchPercentage(60.0);
            q.setMaxResults(30);
        }

        List<String> skills = parseJsonList(profile.getSkillsJson());
        q.setCandidateSkills(skills);
        return q;
    }

    private List<JobSourceConfig> filterSelectedSources(List<JobSourceConfig> configs, JobSearchQuery query) {
        return configs;
    }

    private CandidateProfile createDefaultProfile(User user) {
        CandidateProfile p = new CandidateProfile();
        p.setUser(user);
        p.setCandidateName(user.getFullName());
        p.setEmail(user.getEmail());
        p.setLocation("India");
        p.setYearsOfExperience(1.5);
        p.setHighestDegree("Bachelor of Technology");
        p.setSummary("Software engineer with experience in Java, Spring Boot, REST APIs, and database engineering.");
        try {
            p.setSkillsJson(objectMapper.writeValueAsString(Arrays.asList("Java", "Spring Boot", "REST API", "PostgreSQL", "Git")));
            p.setPreferredRolesJson(objectMapper.writeValueAsString(Arrays.asList("Java Developer", "Backend Developer")));
            p.setLocationsJson(objectMapper.writeValueAsString(Arrays.asList("India", "Remote Worldwide")));
            p.setRemotePreferenceJson(objectMapper.writeValueAsString(Arrays.asList("REMOTE", "HYBRID")));
        } catch (Exception ignored) {}
        return candidateProfileRepository.save(p);
    }

    private String normalizeString(String val) {
        if (val == null) return "";
        return val.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.trim().isEmpty() || json.equals("[]")) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public static class JobMatchResult {
        private Job job;
        private JobMatch jobMatch;
        private boolean isSaved;
        private String applicationStatus;

        public JobMatchResult() {}

        public JobMatchResult(Job job, JobMatch jobMatch) {
            this.job = job;
            this.jobMatch = jobMatch;
        }

        public Job getJob() { return job; }
        public void setJob(Job job) { this.job = job; }

        public JobMatch getJobMatch() { return jobMatch; }
        public void setJobMatch(JobMatch jobMatch) { this.jobMatch = jobMatch; }

        public boolean isSaved() { return isSaved; }
        public void setSaved(boolean saved) { isSaved = saved; }

        public String getApplicationStatus() { return applicationStatus; }
        public void setApplicationStatus(String applicationStatus) { this.applicationStatus = applicationStatus; }
    }

    public static class SourceProgressItem {
        private String sourceName;
        private String message;
        private int jobsFound;
        private String status;

        public SourceProgressItem() {}

        public SourceProgressItem(String sourceName, String message, int jobsFound, String status) {
            this.sourceName = sourceName;
            this.message = message;
            this.jobsFound = jobsFound;
            this.status = status;
        }

        public String getSourceName() { return sourceName; }
        public void setSourceName(String sourceName) { this.sourceName = sourceName; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public int getJobsFound() { return jobsFound; }
        public void setJobsFound(int jobsFound) { this.jobsFound = jobsFound; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class SearchResultResponse {
        private List<JobMatchResult> jobs;
        private int totalRawFound;
        private int deduplicatedCount;
        private int matchedCount;
        private List<SourceProgressItem> progressLog;

        public SearchResultResponse() {}

        public SearchResultResponse(List<JobMatchResult> jobs, int totalRawFound, int deduplicatedCount, int matchedCount, List<SourceProgressItem> progressLog) {
            this.jobs = jobs;
            this.totalRawFound = totalRawFound;
            this.deduplicatedCount = deduplicatedCount;
            this.matchedCount = matchedCount;
            this.progressLog = progressLog;
        }

        public List<JobMatchResult> getJobs() { return jobs; }
        public void setJobs(List<JobMatchResult> jobs) { this.jobs = jobs; }

        public int getTotalRawFound() { return totalRawFound; }
        public void setTotalRawFound(int totalRawFound) { this.totalRawFound = totalRawFound; }

        public int getDeduplicatedCount() { return deduplicatedCount; }
        public void setDeduplicatedCount(int deduplicatedCount) { this.deduplicatedCount = deduplicatedCount; }

        public int getMatchedCount() { return matchedCount; }
        public void setMatchedCount(int matchedCount) { this.matchedCount = matchedCount; }

        public List<SourceProgressItem> getProgressLog() { return progressLog; }
        public void setProgressLog(List<SourceProgressItem> progressLog) { this.progressLog = progressLog; }
    }
}
