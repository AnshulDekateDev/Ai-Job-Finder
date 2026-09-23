package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.FetchRequest;
import com.aijobfinder.provider.scraper.PageResult;
import com.aijobfinder.provider.scraper.ScraperProvider;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class WeWorkRemotelySourceAdapter implements JobSourceAdapter {

    private static final Logger log = LoggerFactory.getLogger(WeWorkRemotelySourceAdapter.class);
    private static final String DEFAULT_RSS_URL = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

    @Override
    public String getSourceCode() {
        return "WE_WORK_REMOTELY";
    }

    @Override
    public String getDisplayName() {
        return "We Work Remotely";
    }

    @Override
    public SourceAccessStatus checkAccessStatus(JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        return SourceAccessStatus.ready("Public RSS syndication feed active");
    }

    @Override
    public List<JobData> search(JobSearchQuery query, JobSourceConfig config, ScraperProvider scraperProvider, String scraperApiKey) {
        List<JobData> results = new ArrayList<>();
        String url = (config != null && config.getBaseUrl() != null && !config.getBaseUrl().trim().isEmpty())
                ? config.getBaseUrl() : DEFAULT_RSS_URL;

        try {
            FetchRequest req = new FetchRequest(url);
            PageResult pageResult = scraperProvider.fetch(req, scraperApiKey, null);
            if (pageResult.isSuccessful() && pageResult.getHtmlContent() != null) {
                Document doc = Jsoup.parse(pageResult.getHtmlContent(), "", Parser.xmlParser());
                Elements items = doc.select("item");
                for (Element item : items) {
                    String titleRaw = item.select("title").text();
                    String link = item.select("link").text();
                    String guid = item.select("guid").text();
                    String description = item.select("description").text();

                    // Parse title format e.g. "Company: Job Title"
                    String company = "Company";
                    String title = titleRaw;
                    if (titleRaw.contains(":")) {
                        String[] parts = titleRaw.split(":", 2);
                        company = parts[0].trim();
                        title = parts[1].trim();
                    }

                    if (matchesQuery(title, query)) {
                        JobData job = new JobData();
                        job.setExternalId("WWR-" + (guid.isEmpty() ? String.valueOf(titleRaw.hashCode()) : guid));
                        job.setSource(getSourceCode());
                        job.setTitle(title);
                        job.setCompany(company);
                        job.setLocation("Remote Worldwide");
                        job.setCountry("Worldwide");
                        job.setRemoteType("REMOTE");
                        job.setDescription(cleanHtml(description));
                        job.setRequirements("Requirements listed in job posting.");

                        List<String> skills = extractSkills(title + " " + description);
                        job.setSkills(skills);
                        job.setMinExperienceRequired(0.0);
                        job.setMaxExperienceRequired(3.0);
                        job.setApplicationUrl(link);
                        job.setJobUrl(link);
                        job.setPostedAt(LocalDateTime.now().minusHours(6));

                        results.add(job);
                        if (results.size() >= query.getMaxResults()) {
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error reading WeWorkRemotely RSS: {}", e.getMessage());
        }

        return results;
    }

    private boolean matchesQuery(String title, JobSearchQuery query) {
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
        String[] keywords = {"Java", "Spring Boot", "REST API", "PostgreSQL", "MySQL", "AWS", "Docker", "Kubernetes", "Python", "React", "TypeScript", "Node.js", "Redis", "Git"};
        String lower = text.toLowerCase();
        for (String kw : keywords) {
            if (lower.contains(kw.toLowerCase())) found.add(kw);
        }
        if (found.isEmpty()) {
            found.addAll(Arrays.asList("Java", "Spring Boot", "REST API"));
        }
        return found;
    }

    private String cleanHtml(String html) {
        if (html == null) return "";
        return Jsoup.parse(html).text();
    }
}
