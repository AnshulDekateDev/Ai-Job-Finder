package com.aijobfinder.service;

import com.aijobfinder.entity.*;
import com.aijobfinder.repository.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer {

    private final JobSourceConfigRepository jobSourceRepo;
    private final SearchPreferenceRepository searchPrefRepo;

    public DataInitializer(JobSourceConfigRepository jobSourceRepo, SearchPreferenceRepository searchPrefRepo) {
        this.jobSourceRepo = jobSourceRepo;
        this.searchPrefRepo = searchPrefRepo;
    }

    @Transactional
    public void initializeUserData(User user) {
        // Starter list of Job Sources
        List<JobSourceConfig> defaultSources = Arrays.asList(
                new JobSourceConfig(user, "RemoteOK", "REMOTEOK", "https://remoteok.com/api", "DIRECT_PUBLIC_FEED", true, false, "READY", "Public feed active"),
                new JobSourceConfig(user, "Greenhouse", "GREENHOUSE", "https://boards-api.greenhouse.io", "DIRECT_PUBLIC_FEED", true, false, "READY", "Public board aggregation active"),
                new JobSourceConfig(user, "Lever", "LEVER", "https://api.lever.co", "DIRECT_PUBLIC_FEED", true, false, "READY", "Public board aggregation active"),
                new JobSourceConfig(user, "We Work Remotely", "WE_WORK_REMOTELY", "https://weworkremotely.com/categories/remote-programming-jobs.rss", "DIRECT_PUBLIC_FEED", true, false, "READY", "Public RSS syndication active"),
                new JobSourceConfig(user, "Google Jobs", "GOOGLE_JOBS", "https://www.google.com/search?ibp=htl;jobs", "SCRAPER_PROVIDER", true, false, "NEEDS_CONFIG", "Requires configured Scraper Provider"),
                new JobSourceConfig(user, "Indeed", "INDEED", "https://www.indeed.com", "SCRAPER_PROVIDER", false, false, "NEEDS_CONFIG", "Requires authorized Scraper Provider"),
                new JobSourceConfig(user, "LinkedIn", "LINKEDIN", "https://www.linkedin.com/jobs", "SCRAPER_PROVIDER", false, false, "NEEDS_CONFIG", "Requires authorized Scraper Provider"),
                new JobSourceConfig(user, "Wellfound", "WELLFOUND", "https://wellfound.com/jobs", "DIRECT_PUBLIC_FEED", false, false, "READY", "Startup jobs feed")
        );

        for (JobSourceConfig src : defaultSources) {
            jobSourceRepo.save(src);
        }

        // Starter Search Preference
        if (!searchPrefRepo.findByUser(user).isPresent()) {
            SearchPreference pref = new SearchPreference();
            pref.setUser(user);
            pref.setTargetTitlesJson("[\"Java Developer\", \"Backend Developer\", \"Spring Boot Developer\"]");
            pref.setTargetLocationsJson("[\"India\", \"Remote India\", \"Remote Worldwide\"]");
            pref.setCountriesJson("[\"India\", \"United States\", \"United Kingdom\", \"Germany\", \"Canada\", \"Australia\"]");
            pref.setWorkModesJson("[\"REMOTE\", \"HYBRID\", \"ON_SITE\"]");
            pref.setExperienceRange("0-2 years");
            pref.setMinMatchPercentage(60.0);
            pref.setMaxResults(30);
            pref.setSelectedSourcesJson("[\"REMOTEOK\", \"GREENHOUSE\", \"LEVER\", \"WE_WORK_REMOTELY\", \"GOOGLE_JOBS\"]");
            pref.setUpdatedAt(LocalDateTime.now());
            searchPrefRepo.save(pref);
        }
    }
}
