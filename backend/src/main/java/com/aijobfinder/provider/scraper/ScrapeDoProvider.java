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
public class ScrapeDoProvider implements ScraperProvider {

    private static final Logger log = LoggerFactory.getLogger(ScrapeDoProvider.class);
    private static final String DEFAULT_SCRAPE_DO_URL = "http://api.scrape.do";

    private final RestTemplate restTemplate;

    public ScrapeDoProvider(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderType() {
        return "SCRAPE_DO";
    }

    @Override
    public boolean testConnection(String apiKey, String baseUrl) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalArgumentException("Scrape.do token/API key is required");
            }
            String rootUrl = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl : DEFAULT_SCRAPE_DO_URL;
            String endpoint = UriComponentsBuilder.fromHttpUrl(rootUrl)
                    .queryParam("token", apiKey.trim())
                    .queryParam("url", "https://httpbin.org/ip")
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(endpoint, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Scrape.do test connection failed: {}", e.getMessage());
            throw new RuntimeException("Scrape.do connection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public PageResult fetch(FetchRequest request, String apiKey, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return PageResult.failure(request.getUrl(), "Scrape.do token is missing in user settings");
        }
        try {
            String rootUrl = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl : DEFAULT_SCRAPE_DO_URL;
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(rootUrl)
                    .queryParam("token", apiKey.trim())
                    .queryParam("url", request.getUrl());

            if (request.isRenderJs()) {
                builder.queryParam("render", "true");
            }
            if (request.getCountryCode() != null && !request.getCountryCode().trim().isEmpty()) {
                builder.queryParam("geoCode", request.getCountryCode().toLowerCase());
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
            log.warn("Failed fetching {} via Scrape.do: {}", request.getUrl(), e.getMessage());
            return PageResult.failure(request.getUrl(), "Scrape.do error: " + e.getMessage());
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
