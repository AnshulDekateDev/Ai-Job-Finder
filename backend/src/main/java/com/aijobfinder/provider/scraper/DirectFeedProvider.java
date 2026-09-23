package com.aijobfinder.provider.scraper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class DirectFeedProvider implements ScraperProvider {

    private static final Logger log = LoggerFactory.getLogger(DirectFeedProvider.class);

    private final RestTemplate restTemplate;

    public DirectFeedProvider(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderType() {
        return "DIRECT_FEED";
    }

    @Override
    public boolean testConnection(String apiKey, String baseUrl) {
        return true;
    }

    @Override
    public PageResult fetch(FetchRequest request, String apiKey, String baseUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (AIJobFinder/1.0)");
            headers.setAccept(Collections.singletonList(MediaType.ALL));

            if (request.getHeaders() != null) {
                for (Map.Entry<String, String> entry : request.getHeaders().entrySet()) {
                    headers.set(entry.getKey(), entry.getValue());
                }
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(request.getUrl(), HttpMethod.GET, entity, String.class);

            return new PageResult(
                    request.getUrl(),
                    response.getStatusCodeValue(),
                    response.getBody(),
                    response.getHeaders().getContentType() != null ? response.getHeaders().getContentType().toString() : "application/json",
                    response.getStatusCode().is2xxSuccessful()
            );
        } catch (Exception e) {
            log.warn("Direct feed request failed for {}: {}", request.getUrl(), e.getMessage());
            return PageResult.failure(request.getUrl(), "Direct fetch error: " + e.getMessage());
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
