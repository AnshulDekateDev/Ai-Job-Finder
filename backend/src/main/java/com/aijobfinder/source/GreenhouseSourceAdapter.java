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

import java.time.LocalDateTime;
import java.util.*;

@Component
public class GreenhouseSourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(GreenhouseSourceAdapter.class);
    private final ObjectMapper objectMapper;

    // Starter public greenhouse board feeds for active companies
    private static final List<String> DEFAULT_COMPANIES = Arrays.asList(
            "stripe", "airbnb", "github", "discord", "figma", "coinbase", "brex", "postman"
    );

    public GreenhouseSourceAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getSourceCode() {
        return "GREENHOUSE";
    }

    @Override
    public String getDisplayName() {
        return "Greenhouse";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return SourceAccessStatus.ready("Public Greenhouse job board integration active");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        List<JobData> results = new ArrayList<>();

        for (String company : DEFAULT_COMPANIES) {
            String url = "https://boards-api.greenhouse.io/v1/boards/" + company + "/jobs?content=true";
            try {
                FetchRequest req = new FetchRequest(url);
                PageResult pageResult = scraperProvider.fetch(req, scraperApiKey, null);
                if (pageResult.isSuccessful() && pageResult.getHtmlContent() != null) {
                    JsonNode root = objectMapper.readTree(pageResult.getHtmlContent());
                    JsonNode jobsNode = root.path("jobs");
                    if (jobsNode.isArray()) {
                        for (JsonNode item : jobsNode) {
                            String title = item.path("title").asText("");
                            String externalId = item.path("id").asText("");
                            String absoluteUrl = item.path("absolute_url").asText("");
                            String location = item.path("location").path("name").asText("Remote");
                            String content = item.path("content").asText("");

                            if (matchesQuery(title, location, query)) {
                                JobData job = new JobData();
                                job.setExternalId("GH-" + externalId);
                                job.setSource(getSourceCode());
                                job.setTitle(title);
                                job.setCompany(capitalize(company));
                                job.setLocation(location);
                                job.setCountry(detectCountry(location));
                                job.setRemoteType(location.toLowerCase().contains("remote") ? "REMOTE" : "HYBRID");
                                job.setDescription(cleanHtml(content));
                                job.setRequirements("Requirements outlined in job description.");

                                List<String> skills = extractSkillsFromText(title + " " + content);
                                job.setSkills(skills);
                                job.setMinExperienceRequired(0.0);
                                job.setMaxExperienceRequired(3.0);
                                job.setApplicationUrl(absoluteUrl);
                                job.setJobUrl(absoluteUrl);
                                job.setPostedAt(LocalDateTime.now().minusDays(1));

                                results.add(job);
                                if (results.size() >= query.getMaxResults()) {
                                    return results;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed fetching Greenhouse jobs for {}: {}", company, e.getMessage());
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

    private List<String> extractSkillsFromText(String text) {
        List<String> found = new ArrayList<>();
        String[] keywords = {"Java", "Spring Boot", "REST API", "PostgreSQL", "MySQL", "AWS", "Docker", "Kubernetes", "Microservices", "Python", "React", "TypeScript", "Kafka", "Redis", "Git", "CI/CD"};
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
        if (l.contains("india") || l.contains("bangalore") || l.contains("pune") || l.contains("hyderabad")) return "India";
        if (l.contains("us") || l.contains("united states") || l.contains("san francisco") || l.contains("new york")) return "United States";
        if (l.contains("uk") || l.contains("london")) return "United Kingdom";
        if (l.contains("germany") || l.contains("berlin")) return "Germany";
        return "Worldwide";
    }

    private String cleanHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
    }

    private String capitalize(String name) {
        if (name == null || name.isEmpty()) return "";
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }
}
