package com.aijobfinder.controller;

import com.aijobfinder.entity.AiProviderCredential;
import com.aijobfinder.entity.ScraperCredential;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.service.IntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    private final IntegrationService integrationService;

    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    // AI Providers
    @GetMapping("/ai")
    public ResponseEntity<List<AiProviderCredential>> getAiProviders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(integrationService.getUserAiCredentials(userPrincipal.getUser()));
    }

    @PostMapping("/ai")
    public ResponseEntity<?> saveAiProvider(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> req
    ) {
        String providerType = (String) req.get("providerType");
        String apiKey = (String) req.get("apiKey");
        String modelName = (String) req.get("modelName");
        String baseUrl = (String) req.get("baseUrl");
        Boolean isDefault = (Boolean) req.get("isDefault");

        if (providerType == null || providerType.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorMap("Provider type is required (e.g. GEMINI, OPENAI, ANTHROPIC)"));
        }

        AiProviderCredential saved = integrationService.saveOrUpdateAiCredential(
                userPrincipal.getUser(), providerType, apiKey, modelName, baseUrl, isDefault != null ? isDefault : true
        );
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/ai/{id}/test")
    public ResponseEntity<?> testAiProvider(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            String rawKey = (body != null) ? body.get("apiKey") : null;
            boolean success = integrationService.testAiCredential(userPrincipal.getUser(), id, rawKey);
            Map<String, Object> res = new HashMap<>();
            res.put("success", success);
            res.put("status", success ? "READY" : "ERROR");
            res.put("message", success ? "AI Provider verified and connected successfully" : "Failed to connect");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("status", "INVALID_KEY");
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @DeleteMapping("/ai/{id}")
    public ResponseEntity<?> deleteAiProvider(@AuthenticationPrincipal UserPrincipal userPrincipal, @PathVariable Long id) {
        integrationService.deleteAiCredential(userPrincipal.getUser(), id);
        return ResponseEntity.ok(Map.of("message", "AI provider deleted successfully"));
    }

    // Scraper Providers
    @GetMapping("/scrapers")
    public ResponseEntity<List<ScraperCredential>> getScraperProviders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(integrationService.getUserScraperCredentials(userPrincipal.getUser()));
    }

    @PostMapping("/scrapers")
    public ResponseEntity<?> saveScraperProvider(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> req
    ) {
        String providerType = (String) req.get("providerType");
        String apiKey = (String) req.get("apiKey");
        String baseUrl = (String) req.get("baseUrl");
        Boolean isDefault = (Boolean) req.get("isDefault");

        if (providerType == null || providerType.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorMap("Scraper provider type is required (e.g. SCRAPER_API, BRIGHT_DATA, APIFY)"));
        }

        ScraperCredential saved = integrationService.saveOrUpdateScraperCredential(
                userPrincipal.getUser(), providerType, apiKey, baseUrl, isDefault != null ? isDefault : true
        );
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/scrapers/{id}/test")
    public ResponseEntity<?> testScraperProvider(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            String rawKey = (body != null) ? body.get("apiKey") : null;
            boolean success = integrationService.testScraperCredential(userPrincipal.getUser(), id, rawKey);
            Map<String, Object> res = new HashMap<>();
            res.put("success", success);
            res.put("status", success ? "READY" : "ERROR");
            res.put("message", success ? "Scraper provider verified successfully" : "Failed to connect");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("status", "INVALID_KEY");
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @DeleteMapping("/scrapers/{id}")
    public ResponseEntity<?> deleteScraperProvider(@AuthenticationPrincipal UserPrincipal userPrincipal, @PathVariable Long id) {
        integrationService.deleteScraperCredential(userPrincipal.getUser(), id);
        return ResponseEntity.ok(Map.of("message", "Scraper provider deleted successfully"));
    }

    private Map<String, String> errorMap(String msg) {
        Map<String, String> m = new HashMap<>();
        m.put("error", msg);
        return m;
    }
}
