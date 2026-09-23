package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.FetchRequest;
import com.aijobfinder.provider.scraper.PageResult;
import com.aijobfinder.provider.scraper.ScraperProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class CustomJobSourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(CustomJobSourceAdapter.class);
    private final ObjectMapper objectMapper;

    public CustomJobSourceAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getSourceCode() {
        return "CUSTOM";
    }

    @Override
    public String getDisplayName() {
        return "Custom Source";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        if (config.getBaseUrl() == null || config.getBaseUrl().trim().isEmpty()) {
            return SourceAccessStatus.needsConfig("Website base URL is required");
        }
        return SourceAccessStatus.ready("Custom source configured and ready");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        List<JobData> results = new ArrayList<>();
        if (config == null || config.getBaseUrl() == null || config.getBaseUrl().trim().isEmpty()) {
            return results;
        }

        try {
            String targetUrl = config.getBaseUrl();
            if (config.getSearchUrlPattern() != null && !config.getSearchUrlPattern().trim().isEmpty()) {
                String q = (query.getTitles() != null && !query.getTitles().isEmpty()) ? query.getTitles().get(0) : "developer";
                targetUrl = config.getSearchUrlPattern().replace("{query}", URLEncoder.encode(q, StandardCharsets.UTF_8.toString()));
            }

            FetchRequest req = new FetchRequest(targetUrl);
            PageResult page = scraperProvider.fetch(req, scraperApiKey, null);
            if (page.isSuccessful() && page.getHtmlContent() != null) {
                // Check if JSON response
                if (page.getContentType() != null && page.getContentType().contains("json")) {
                    JsonNode root = objectMapper.readTree(page.getHtmlContent());
                    if (root.isArray()) {
                        for (JsonNode item : root) {
                            String title = item.path("title").asText(item.path("name").asText(""));
                            if (!title.isEmpty()) {
                                JobData job = new JobData();
                                job.setExternalId("CUST-" + config.getId() + "-" + item.path("id").asText(String.valueOf(title.hashCode())));
                                job.setSource(config.getName());
                                job.setTitle(title);
                                job.setCompany(item.path("company").asText(config.getName()));
                                job.setLocation(item.path("location").asText("Remote"));
                                job.setCountry("Worldwide");
                                job.setRemoteType("REMOTE");
                                job.setDescription(item.path("description").asText(""));
                                job.setRequirements("Custom source requirements.");
                                job.setSkills(Arrays.asList("Java", "Backend"));
                                job.setApplicationUrl(item.path("url").asText(targetUrl));
                                job.setJobUrl(item.path("url").asText(targetUrl));
                                job.setPostedAt(LocalDateTime.now());
                                results.add(job);
                            }
                        }
                    }
                } else {
                    // HTML Page Parsing
                    Document doc = Jsoup.parse(page.getHtmlContent());
                    Elements links = doc.select("a[href*='job'], a[href*='career'], div.job-card, div.career-item");
                    for (Element el : links) {
                        String title = el.text().trim();
                        String href = el.attr("abs:href");
                        if (title.length() > 5 && title.length() < 100) {
                            JobData job = new JobData();
                            job.setExternalId("CUST-" + config.getId() + "-" + Math.abs(title.hashCode()));
                            job.setSource(config.getName());
                            job.setTitle(title);
                            job.setCompany(config.getName());
                            job.setLocation("Remote");
                            job.setCountry("Worldwide");
                            job.setRemoteType("REMOTE");
                            job.setDescription("Discovered on " + config.getName());
                            job.setRequirements("Requirements listed at posting.");
                            job.setSkills(Arrays.asList("Software Development"));
                            job.setApplicationUrl(href.isEmpty() ? targetUrl : href);
                            job.setJobUrl(href.isEmpty() ? targetUrl : href);
                            job.setPostedAt(LocalDateTime.now());
                            results.add(job);
                            if (results.size() >= 5) break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error executing custom job source search for {}: {}", config.getName(), e.getMessage());
        }

        return results;
    }
}
