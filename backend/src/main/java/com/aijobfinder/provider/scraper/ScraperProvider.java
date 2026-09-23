package com.aijobfinder.provider.scraper;

import java.util.List;

public interface ScraperProvider {

    String getProviderType();

    boolean testConnection(String apiKey, String baseUrl);

    PageResult fetch(FetchRequest request, String apiKey, String baseUrl);

    List<PageResult> fetchAll(List<FetchRequest> requests, String apiKey, String baseUrl);
}
