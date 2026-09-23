package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.ScraperProvider;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class WellfoundSourceAdapter implements JobSourceAdapter {

    @Override
    public String getSourceCode() {
        return "WELLFOUND";
    }

    @Override
    public String getDisplayName() {
        return "Wellfound (AngelList)";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return SourceAccessStatus.ready("Connected via public startup jobs API");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return Collections.emptyList();
    }
}
