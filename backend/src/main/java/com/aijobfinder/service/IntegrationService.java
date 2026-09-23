package com.aijobfinder.service;

import com.aijobfinder.entity.AiProviderCredential;
import com.aijobfinder.entity.ScraperCredential;
import com.aijobfinder.entity.User;
import com.aijobfinder.provider.llm.LLMProvider;
import com.aijobfinder.provider.llm.LLMProviderFactory;
import com.aijobfinder.provider.scraper.ScraperProvider;
import com.aijobfinder.provider.scraper.ScraperProviderFactory;
import com.aijobfinder.repository.AiProviderCredentialRepository;
import com.aijobfinder.repository.ScraperCredentialRepository;
import com.aijobfinder.security.CryptoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IntegrationService {

    private final AiProviderCredentialRepository aiRepo;
    private final ScraperCredentialRepository scraperRepo;
    private final CryptoService cryptoService;
    private final LLMProviderFactory llmFactory;
    private final ScraperProviderFactory scraperFactory;

    public IntegrationService(
            AiProviderCredentialRepository aiRepo,
            ScraperCredentialRepository scraperRepo,
            CryptoService cryptoService,
            LLMProviderFactory llmFactory,
            ScraperProviderFactory scraperFactory
    ) {
        this.aiRepo = aiRepo;
        this.scraperRepo = scraperRepo;
        this.cryptoService = cryptoService;
        this.llmFactory = llmFactory;
        this.scraperFactory = scraperFactory;
    }

    // AI Credential Operations
    public List<AiProviderCredential> getUserAiCredentials(User user) {
        List<AiProviderCredential> list = aiRepo.findByUser(user);
        for (AiProviderCredential cred : list) {
            String decrypted = cred.getEncryptedApiKey() != null ? cryptoService.decrypt(cred.getEncryptedApiKey()) : "";
            cred.setMaskedApiKey(cryptoService.maskKey(decrypted));
        }
        return list;
    }

    @Transactional
    public AiProviderCredential saveOrUpdateAiCredential(User user, String providerType, String apiKey, String modelName, String baseUrl, Boolean isDefault) {
        Optional<AiProviderCredential> existing = aiRepo.findByUserAndProviderType(user, providerType.toUpperCase());
        AiProviderCredential cred = existing.orElseGet(AiProviderCredential::new);
        cred.setUser(user);
        cred.setProviderType(providerType.toUpperCase());
        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("••••")) {
            cred.setEncryptedApiKey(cryptoService.encrypt(apiKey.trim()));
            cred.setMaskedApiKey(cryptoService.maskKey(apiKey.trim()));
        }
        if (modelName != null) cred.setModelName(modelName.trim());
        if (baseUrl != null) cred.setBaseUrl(baseUrl.trim());
        if (isDefault != null && isDefault) {
            clearAiDefault(user);
            cred.setDefault(true);
        }
        cred.setActive(true);
        cred.setUpdatedAt(LocalDateTime.now());
        return aiRepo.save(cred);
    }

    @Transactional
    public boolean testAiCredential(User user, Long id, String rawKeyIfTestingNew) {
        AiProviderCredential cred = aiRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("AI Credential not found with id: " + id));

        String keyToTest = (rawKeyIfTestingNew != null && !rawKeyIfTestingNew.trim().isEmpty())
                ? rawKeyIfTestingNew.trim()
                : cryptoService.decrypt(cred.getEncryptedApiKey());

        LLMProvider provider = llmFactory.getProviderByType(cred.getProviderType());
        try {
            boolean success = provider.testConnection(keyToTest, cred.getModelName(), cred.getBaseUrl());
            cred.setStatus(success ? "READY" : "ERROR");
            cred.setLastStatusMessage(success ? "Connection verified successfully" : "Connection verification failed");
            cred.setLastTestedAt(LocalDateTime.now());
            aiRepo.save(cred);
            return success;
        } catch (Exception e) {
            cred.setStatus("INVALID_KEY");
            cred.setLastStatusMessage(e.getMessage());
            cred.setLastTestedAt(LocalDateTime.now());
            aiRepo.save(cred);
            throw new RuntimeException("AI Provider connection test failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteAiCredential(User user, Long id) {
        AiProviderCredential cred = aiRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("AI Credential not found with id: " + id));
        aiRepo.delete(cred);
    }

    private void clearAiDefault(User user) {
        List<AiProviderCredential> list = aiRepo.findByUser(user);
        for (AiProviderCredential c : list) {
            c.setDefault(false);
            aiRepo.save(c);
        }
    }

    // Scraper Credential Operations
    public List<ScraperCredential> getUserScraperCredentials(User user) {
        List<ScraperCredential> list = scraperRepo.findByUser(user);
        for (ScraperCredential cred : list) {
            String decrypted = cred.getEncryptedApiKey() != null ? cryptoService.decrypt(cred.getEncryptedApiKey()) : "";
            cred.setMaskedApiKey(cryptoService.maskKey(decrypted));
        }
        return list;
    }

    @Transactional
    public ScraperCredential saveOrUpdateScraperCredential(User user, String providerType, String apiKey, String baseUrl, Boolean isDefault) {
        Optional<ScraperCredential> existing = scraperRepo.findByUserAndProviderType(user, providerType.toUpperCase());
        ScraperCredential cred = existing.orElseGet(ScraperCredential::new);
        cred.setUser(user);
        cred.setProviderType(providerType.toUpperCase());
        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("••••")) {
            cred.setEncryptedApiKey(cryptoService.encrypt(apiKey.trim()));
            cred.setMaskedApiKey(cryptoService.maskKey(apiKey.trim()));
        }
        if (baseUrl != null) cred.setBaseUrl(baseUrl.trim());
        if (isDefault != null && isDefault) {
            clearScraperDefault(user);
            cred.setDefault(true);
        }
        cred.setActive(true);
        cred.setUpdatedAt(LocalDateTime.now());
        return scraperRepo.save(cred);
    }

    @Transactional
    public boolean testScraperCredential(User user, Long id, String rawKeyIfTestingNew) {
        ScraperCredential cred = scraperRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Scraper Credential not found with id: " + id));

        String keyToTest = (rawKeyIfTestingNew != null && !rawKeyIfTestingNew.trim().isEmpty())
                ? rawKeyIfTestingNew.trim()
                : (cred.getEncryptedApiKey() != null ? cryptoService.decrypt(cred.getEncryptedApiKey()) : "");

        ScraperProvider provider = scraperFactory.getProviderByType(cred.getProviderType());
        try {
            boolean success = provider.testConnection(keyToTest, cred.getBaseUrl());
            cred.setStatus(success ? "READY" : "ERROR");
            cred.setLastStatusMessage(success ? "Scraper provider verified successfully" : "Connection failed");
            cred.setLastTestedAt(LocalDateTime.now());
            scraperRepo.save(cred);
            return success;
        } catch (Exception e) {
            cred.setStatus("INVALID_KEY");
            cred.setLastStatusMessage(e.getMessage());
            cred.setLastTestedAt(LocalDateTime.now());
            scraperRepo.save(cred);
            throw new RuntimeException("Scraper connection test failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteScraperCredential(User user, Long id) {
        ScraperCredential cred = scraperRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Scraper Credential not found with id: " + id));
        scraperRepo.delete(cred);
    }

    private void clearScraperDefault(User user) {
        List<ScraperCredential> list = scraperRepo.findByUser(user);
        for (ScraperCredential c : list) {
            c.setDefault(false);
            scraperRepo.save(c);
        }
    }
}
