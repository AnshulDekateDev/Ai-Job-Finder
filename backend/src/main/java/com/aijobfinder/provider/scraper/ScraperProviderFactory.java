package com.aijobfinder.provider.scraper;

import com.aijobfinder.entity.ScraperCredential;
import com.aijobfinder.entity.User;
import com.aijobfinder.repository.ScraperCredentialRepository;
import com.aijobfinder.security.CryptoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScraperProviderFactory {

    private final List<ScraperProvider> providers;
    private final ScraperCredentialRepository credentialRepository;
    private final CryptoService cryptoService;
    private final DirectFeedProvider directFeedProvider;

    public ScraperProviderFactory(
            List<ScraperProvider> providers,
            ScraperCredentialRepository credentialRepository,
            CryptoService cryptoService,
            DirectFeedProvider directFeedProvider
    ) {
        this.providers = providers;
        this.credentialRepository = credentialRepository;
        this.cryptoService = cryptoService;
        this.directFeedProvider = directFeedProvider;
    }

    public ActiveScraperContext resolveActiveContext(User user) {
        Optional<ScraperCredential> defaultCred = credentialRepository.findByUserAndIsDefaultTrue(user);
        if (!defaultCred.isPresent()) {
            List<ScraperCredential> all = credentialRepository.findByUser(user);
            if (!all.isEmpty()) {
                defaultCred = Optional.of(all.get(0));
            }
        }

        if (defaultCred.isPresent() && defaultCred.get().isActive()) {
            ScraperCredential cred = defaultCred.get();
            String decryptedKey = cred.getEncryptedApiKey() != null ? cryptoService.decrypt(cred.getEncryptedApiKey()) : "";
            ScraperProvider provider = getProviderByType(cred.getProviderType());
            return new ActiveScraperContext(provider, decryptedKey, cred.getBaseUrl(), cred.getProviderType());
        }

        // Default to Direct Public Feed scraper
        return new ActiveScraperContext(directFeedProvider, "", null, "DIRECT_FEED");
    }

    public ScraperProvider getProviderByType(String providerType) {
        if (providerType == null) return directFeedProvider;
        for (ScraperProvider p : providers) {
            if (p.getProviderType().equalsIgnoreCase(providerType)) {
                return p;
            }
        }
        return directFeedProvider;
    }

    public static class ActiveScraperContext {
        private final ScraperProvider provider;
        private final String decryptedApiKey;
        private final String baseUrl;
        private final String providerType;

        public ActiveScraperContext(ScraperProvider provider, String decryptedApiKey, String baseUrl, String providerType) {
            this.provider = provider;
            this.decryptedApiKey = decryptedApiKey;
            this.baseUrl = baseUrl;
            this.providerType = providerType;
        }

        public ScraperProvider getProvider() { return provider; }
        public String getDecryptedApiKey() { return decryptedApiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getProviderType() { return providerType; }
    }
}
