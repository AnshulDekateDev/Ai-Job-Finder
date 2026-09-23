package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.ScraperProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class LinkedInSourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(LinkedInSourceAdapter.class);

    @Override
    public String getSourceCode() {
        return "LINKEDIN";
    }

    @Override
    public String getDisplayName() {
        return "LinkedIn";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        if (scraperApiKey == null || scraperApiKey.trim().isEmpty()) {
            return SourceAccessStatus.needsConfig("LinkedIn requires configured Scraper Provider / authorized API credentials.");
        }
        return SourceAccessStatus.ready("Connected via configured Scraper Provider");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        if (scraperApiKey == null || scraperApiKey.trim().isEmpty()) {
            log.info("LinkedIn search skipped: Scraper key not configured.");
            return Collections.emptyList();
        }
        return Collections.emptyList();
    }
}
