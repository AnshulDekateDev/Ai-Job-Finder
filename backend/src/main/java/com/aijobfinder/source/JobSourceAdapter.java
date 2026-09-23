package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.ScraperProvider;

import java.util.List;

public interface JobSourceAdapter {

    String getSourceCode();

    String getDisplayName();

    SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey);

    List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey);

    class SourceAccessStatus {
        private String status; // READY, NEEDS_CONFIG, UNAVAILABLE, BLOCKED
        private String message;
        private boolean accessible;

        public SourceAccessStatus() {}

        public SourceAccessStatus(String status, String message, boolean accessible) {
            this.status = status;
            this.message = message;
            this.accessible = accessible;
        }

        public static SourceAccessStatus ready(String message) {
            return new SourceAccessStatus("READY", message, true);
        }

        public static SourceAccessStatus needsConfig(String message) {
            return new SourceAccessStatus("NEEDS_CONFIG", message, false);
        }

        public static SourceAccessStatus unavailable(String message) {
            return new SourceAccessStatus("UNAVAILABLE", message, false);
        }

        public static SourceAccessStatus blocked(String message) {
            return new SourceAccessStatus("BLOCKED", message, false);
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public boolean isAccessible() { return accessible; }
        public void setAccessible(boolean accessible) { this.accessible = accessible; }
    }
}
