package com.aijobfinder.source;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.provider.scraper.ScraperProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;

@Service
public class JobSourceRegistry {

    private static final Logger log = LoggerFactory.getLogger(JobSourceRegistry.class);

    private final Map<String, JobSourceAdapter> adapterMap = new HashMap<>();
    private final CustomJobSourceAdapter customAdapter;
    private final ExecutorService executor = Executors.newFixedThreadPool(8);

    public JobSourceRegistry(List<JobSourceAdapter> adapters, CustomJobSourceAdapter customAdapter) {
        this.customAdapter = customAdapter;
        for (JobSourceAdapter adapter : adapters) {
            adapterMap.put(adapter.getSourceCode().toUpperCase(), adapter);
        }
    }

    public JobSourceAdapter getAdapter(String code) {
        if (code == null) return null;
        JobSourceAdapter adapter = adapterMap.get(code.toUpperCase());
        if (adapter == null) {
            return customAdapter;
        }
        return adapter;
    }

    public List<JobData> searchAll(
            List<JobSourceConfig> enabledConfigs,
            JobSearchQuery query,
            ScraperProvider scraperProvider,
            String scraperApiKey,
            SearchProgressListener progressListener
    ) {
        List<JobData> allResults = new CopyOnWriteArrayList<>();
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (JobSourceConfig config : enabledConfigs) {
            if (!config.isEnabled()) continue;

            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    JobSourceAdapter adapter = getAdapter(config.getCode());
                    if (adapter != null) {
                        if (progressListener != null) {
                            progressListener.onSourceStarted(config.getName());
                        }

                        List<JobData> jobs = adapter.search(query, config, scraperProvider, scraperApiKey);
                        allResults.addAll(jobs);

                        if (progressListener != null) {
                            progressListener.onSourceCompleted(config.getName(), jobs.size());
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed executing search on source {}: {}", config.getName(), e.getMessage());
                    if (progressListener != null) {
                        progressListener.onSourceError(config.getName(), e.getMessage());
                    }
                }
            }, executor);

            futures.add(future);
        }

        try {
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).get(25, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Job search timeout or interruption: {}", e.getMessage());
        }

        return new ArrayList<>(allResults);
    }

    public interface SearchProgressListener {
        void onSourceStarted(String sourceName);
        void onSourceCompleted(String sourceName, int jobsFound);
        void onSourceError(String sourceName, String reason);
    }
}
