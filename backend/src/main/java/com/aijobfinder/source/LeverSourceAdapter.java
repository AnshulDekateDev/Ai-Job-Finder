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
import java.util.Arrays;
import java.util.List;

@Component
public class LeverSourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(LeverSourceAdapter.class);
    private final ObjectMapper objectMapper;

    private static final List<String> DEFAULT_LEVER_COMPANIES = Arrays.asList(
            "atlassian", "netflix", "palantir", "canva", "deliveroo"
    );

    public LeverSourceAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getSourceCode() {
        return "LEVER";
    }

    @Override
    public String getDisplayName() {
        return "Lever";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return SourceAccessStatus.ready("Public Lever job board integration active");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        List<JobData> results = new ArrayList<>();

        for (String company : DEFAULT_LEVER_COMPANIES) {
            String url = "https://api.lever.co/v0/postings/" + company + "?mode=json";
            try {
                FetchRequest req = new FetchRequest(url);
                PageResult pageResult = scraperProvider.fetch(req, scraperApiKey, null);
                if (pageResult.isSuccessful() && pageResult.getHtmlContent() != null) {
                    JsonNode root = objectMapper.readTree(pageResult.getHtmlContent());
                    if (root.isArray()) {
                        for (JsonNode item : root) {
                            String title = item.path("text").asText("");
                            String externalId = item.path("id").asText("");
                            String applyUrl = item.path("applyUrl").asText("");
                            String hostedUrl = item.path("hostedUrl").asText(applyUrl);
                            String location = item.path("categories").path("location").asText("Remote");
                            String commitment = item.path("categories").path("commitment").asText("Full Time");
                            String description = item.path("descriptionPlain").asText("");

                            if (matchesQuery(title, location, query)) {
                                JobData job = new JobData();
                                job.setExternalId("LEV-" + externalId);
                                job.setSource(getSourceCode());
                                job.setTitle(title);
                                job.setCompany(capitalize(company));
                                job.setLocation(location);
                                job.setCountry(detectCountry(location));
                                job.setRemoteType(location.toLowerCase().contains("remote") ? "REMOTE" : "HYBRID");
                                job.setDescription(description);
                                job.setRequirements("Full-time employment requirements.");

                                List<String> skills = extractSkills(title + " " + description);
                                job.setSkills(skills);
                                job.setMinExperienceRequired(0.0);
                                job.setMaxExperienceRequired(3.0);
                                job.setApplicationUrl(hostedUrl);
                                job.setJobUrl(hostedUrl);

                                long createdAtEpoch = item.path("createdAt").asLong(0);
                                if (createdAtEpoch > 0) {
                                    job.setPostedAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAtEpoch), ZoneId.systemDefault()));
                                } else {
                                    job.setPostedAt(LocalDateTime.now().minusDays(2));
                                }

                                results.add(job);
                                if (results.size() >= query.getMaxResults()) {
                                    return results;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed fetching Lever jobs for {}: {}", company, e.getMessage());
            }
        }

        return results;
    }

    private boolean matchesQuery(String title, String location, JobSearchQuery query) {
        if (query.getTitles() == null || query.getTitles().isEmpty()) return true;
        String t = title.toLowerCase();
        for (String q : query.getTitles()) {
            for (String part : q.toLowerCase().split("\\s+")) {
                if (part.length() > 2 && t.contains(part)) return true;
            }
        }
        return false;
    }

    private List<String> extractSkills(String text) {
        List<String> found = new ArrayList<>();
        String[] keywords = {"Java", "Spring Boot", "REST API", "PostgreSQL", "MySQL", "AWS", "Docker", "Kubernetes", "Microservices", "Python", "React", "TypeScript", "Kafka", "Redis", "Git", "GraphQL"};
        String lower = text.toLowerCase();
        for (String kw : keywords) {
            if (lower.contains(kw.toLowerCase())) found.add(kw);
        }
        if (found.isEmpty()) {
            found.addAll(Arrays.asList("Java", "Spring Boot", "REST API"));
        }
        return found;
    }

    private String detectCountry(String loc) {
        if (loc == null) return "Worldwide";
        String l = loc.toLowerCase();
        if (l.contains("india") || l.contains("bangalore") || l.contains("pune")) return "India";
        if (l.contains("us") || l.contains("united states") || l.contains("austin") || l.contains("seattle")) return "United States";
        if (l.contains("uk") || l.contains("london")) return "United Kingdom";
        if (l.contains("australia") || l.contains("sydney")) return "Australia";
        return "Worldwide";
    }

    private String capitalize(String name) {
        if (name == null || name.isEmpty()) return "";
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }
}
