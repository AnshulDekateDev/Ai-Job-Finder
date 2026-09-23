package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.FetchRequest;
import com.aijobfinder.provider.scraper.PageResult;
import com.aijobfinder.provider.scraper.ScraperProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class RemoteOKSourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(RemoteOKSourceAdapter.class);
    private static final String DEFAULT_URL = "https://remoteok.com/api";

    private final ObjectMapper objectMapper;

    public RemoteOKSourceAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getSourceCode() {
        return "REMOTEOK";
    }

    @Override
    public String getDisplayName() {
        return "RemoteOK";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return SourceAccessStatus.ready("Public REST API feed active");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        List<JobData> results = new ArrayList<>();
        String url = (config != null && config.getBaseUrl() != null && !config.getBaseUrl().trim().isEmpty())
                ? config.getBaseUrl() : DEFAULT_URL;

        try {
            FetchRequest request = new FetchRequest(url);
            request.getHeaders().put("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)");

            PageResult pageResult = scraperProvider.fetch(request, scraperApiKey, null);
            if (!pageResult.isSuccessful() || pageResult.getHtmlContent() == null) {
                log.warn("RemoteOK fetch failed: {}", pageResult.getErrorMessage());
                return results;
            }

            JsonNode root = objectMapper.readTree(pageResult.getHtmlContent());
            if (root.isArray()) {
                for (JsonNode item : root) {
                    if (!item.has("position") || !item.has("company")) {
                        continue; // skip legal metadata object at index 0
                    }

                    String title = item.path("position").asText("");
                    String company = item.path("company").asText("");
                    String location = item.path("location").asText("Remote Worldwide");
                    String description = item.path("description").asText("");
                    String applyUrl = item.path("apply_url").asText(item.path("url").asText(""));
                    String jobUrl = item.path("url").asText("");
                    String externalId = item.path("id").asText(company + "-" + title.hashCode());

                    List<String> tags = new ArrayList<>();
                    JsonNode tagsNode = item.path("tags");
                    if (tagsNode.isArray()) {
                        for (JsonNode t : tagsNode) {
                            tags.add(t.asText());
                        }
                    }

                    // Filter matching candidate titles or keywords if specified
                    if (isJobRelevant(title, tags, query)) {
                        JobData job = new JobData();
                        job.setExternalId(externalId);
                        job.setSource(getSourceCode());
                        job.setTitle(title);
                        job.setCompany(company);
                        job.setLocation(location.isEmpty() ? "Remote Worldwide" : location);
                        job.setCountry(detectCountry(location));
                        job.setRemoteType("REMOTE");
                        job.setSalary(item.path("salary_min").asText("") + " - " + item.path("salary_max").asText(""));
                        job.setDescription(cleanHtml(description));
                        job.setRequirements("Experience in " + String.join(", ", tags));
                        job.setSkills(tags);
                        job.setMinExperienceRequired(0.0);
                        job.setMaxExperienceRequired(3.0);
                        job.setApplicationUrl(applyUrl);
                        job.setJobUrl(jobUrl);

                        long epochSec = item.path("epoch").asLong(0);
                        if (epochSec > 0) {
                            job.setPostedAt(LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSec), ZoneId.systemDefault()));
                        } else {
                            job.setPostedAt(LocalDateTime.now());
                        }

                        results.add(job);
                        if (results.size() >= query.getMaxResults()) {
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing RemoteOK jobs: {}", e.getMessage());
        }

        return results;
    }

    private boolean isJobRelevant(String title, List<String> tags, JobSearchQuery query) {
        if (query.getTitles() == null || query.getTitles().isEmpty()) {
            return true;
        }
        String lowerTitle = title.toLowerCase();
        for (String target : query.getTitles()) {
            String[] words = target.toLowerCase().split("\\s+");
            for (String w : words) {
                if (w.length() > 2 && (lowerTitle.contains(w) || hasTag(tags, w))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean hasTag(List<String> tags, String keyword) {
        for (String t : tags) {
            if (t.equalsIgnoreCase(keyword)) return true;
        }
        return false;
    }

    private String detectCountry(String loc) {
        if (loc == null) return "Worldwide";
        String lower = loc.toLowerCase();
        if (lower.contains("india")) return "India";
        if (lower.contains("us") || lower.contains("united states") || lower.contains("usa")) return "United States";
        if (lower.contains("uk") || lower.contains("united kingdom")) return "United Kingdom";
        if (lower.contains("germany")) return "Germany";
        if (lower.contains("canada")) return "Canada";
        return "Worldwide";
    }

    private String cleanHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
    }
}
