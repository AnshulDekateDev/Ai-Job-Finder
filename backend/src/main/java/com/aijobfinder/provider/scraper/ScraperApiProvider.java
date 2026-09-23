package com.aijobfinder.provider.scraper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Component
public class ScraperApiProvider implements ScraperProvider {

    private static final Logger log = LoggerFactory.getLogger(ScraperApiProvider.class);
    private static final String DEFAULT_SCRAPER_API_URL = "http://api.scraperapi.com";

    private final RestTemplate restTemplate;

    public ScraperApiProvider(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderType() {
        return "SCRAPER_API";
    }

    @Override
    public boolean testConnection(String apiKey, String baseUrl) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalArgumentException("ScraperAPI key is required");
            }
            // ScraperAPI account status endpoint or simple test query
            String endpoint = UriComponentsBuilder.fromHttpUrl(baseUrl != null && !baseUrl.trim().isEmpty() ? baseUrl : DEFAULT_SCRAPER_API_URL)
                    .queryParam("api_key", apiKey.trim())
                    .queryParam("url", "https://httpbin.org/ip")
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(endpoint, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("ScraperAPI test connection failed: {}", e.getMessage());
            throw new RuntimeException("ScraperAPI connection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public PageResult fetch(FetchRequest request, String apiKey, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return PageResult.failure(request.getUrl(), "ScraperAPI key is missing in user settings");
        }
        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl != null && !baseUrl.trim().isEmpty() ? baseUrl : DEFAULT_SCRAPER_API_URL)
                    .queryParam("api_key", apiKey.trim())
                    .queryParam("url", request.getUrl());

            if (request.isRenderJs()) {
                builder.queryParam("render", "true");
            }
            if (request.getCountryCode() != null) {
                builder.queryParam("country_code", request.getCountryCode());
            }

            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);
            return new PageResult(
                    request.getUrl(),
                    response.getStatusCodeValue(),
                    response.getBody(),
                    response.getHeaders().getContentType() != null ? response.getHeaders().getContentType().toString() : "text/html",
                    response.getStatusCode().is2xxSuccessful()
            );
        } catch (Exception e) {
            log.warn("Failed fetching {} via ScraperAPI: {}", request.getUrl(), e.getMessage());
            return PageResult.failure(request.getUrl(), "ScraperAPI error: " + e.getMessage());
        }
    }

    @Override
    public List<PageResult> fetchAll(List<FetchRequest> requests, String apiKey, String baseUrl) {
        List<PageResult> results = new ArrayList<>();
        for (FetchRequest req : requests) {
            results.add(fetch(req, apiKey, baseUrl));
        }
        return results;
    }
}
