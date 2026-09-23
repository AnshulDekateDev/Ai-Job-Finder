package com.aijobfinder.provider.scraper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ApifyScraperProvider implements ScraperProvider {

    private static final Logger log = LoggerFactory.getLogger(ApifyScraperProvider.class);

    @Override
    public String getProviderType() {
        return "APIFY";
    }

    @Override
    public boolean testConnection(String apiKey, String baseUrl) {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public PageResult fetch(FetchRequest request, String apiKey, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return PageResult.failure(request.getUrl(), "Apify API token is not configured in user settings");
        }
        return PageResult.failure(request.getUrl(), "Apify actor execution requires task dataset integration");
    }

    @Override
    public List<PageResult> fetchAll(List<FetchRequest> requests, String apiKey, String baseUrl) {
        List<PageResult> results = new ArrayList<>();
        for (FetchRequest req : requests) results.add(fetch(req, apiKey, baseUrl));
        return results;
    }
}
