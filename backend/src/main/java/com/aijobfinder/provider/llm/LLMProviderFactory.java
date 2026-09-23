package com.aijobfinder.provider.llm;

import com.aijobfinder.entity.AiProviderCredential;
import com.aijobfinder.entity.User;
import com.aijobfinder.repository.AiProviderCredentialRepository;
import com.aijobfinder.security.CryptoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LLMProviderFactory {

    private final List<LLMProvider> providers;
    private final AiProviderCredentialRepository credentialRepository;
    private final CryptoService cryptoService;
    private final MockDemoLLMProvider mockDemoLLMProvider;

    public LLMProviderFactory(
            List<LLMProvider> providers,
            AiProviderCredentialRepository credentialRepository,
            CryptoService cryptoService,
            MockDemoLLMProvider mockDemoLLMProvider
    ) {
        this.providers = providers;
        this.credentialRepository = credentialRepository;
        this.cryptoService = cryptoService;
        this.mockDemoLLMProvider = mockDemoLLMProvider;
    }

    public ActiveLLMContext resolveActiveContext(User user) {
        Optional<AiProviderCredential> defaultCred = credentialRepository.findByUserAndIsDefaultTrue(user);
        if (!defaultCred.isPresent()) {
            List<AiProviderCredential> all = credentialRepository.findByUser(user);
            if (!all.isEmpty()) {
                defaultCred = Optional.of(all.get(0));
            }
        }

        if (defaultCred.isPresent() && defaultCred.get().isActive()) {
            AiProviderCredential cred = defaultCred.get();
            String decryptedKey = cryptoService.decrypt(cred.getEncryptedApiKey());
            LLMProvider provider = getProviderByType(cred.getProviderType());
            return new ActiveLLMContext(provider, decryptedKey, cred.getModelName(), cred.getBaseUrl(), cred.getProviderType(), false);
        }

        // Fallback to Demo mode when user has not yet entered any key
        return new ActiveLLMContext(mockDemoLLMProvider, "", "demo-model", null, "DEMO_FALLBACK", true);
    }

    public LLMProvider getProviderByType(String providerType) {
        if (providerType == null) return mockDemoLLMProvider;
        for (LLMProvider p : providers) {
            if (p.getProviderType().equalsIgnoreCase(providerType)) {
                return p;
            }
        }
        // Custom or OpenAI-compatible
        for (LLMProvider p : providers) {
            if (p.getProviderType().equalsIgnoreCase("OPENAI")) {
                return p;
            }
        }
        return mockDemoLLMProvider;
    }

    public static class ActiveLLMContext {
        private final LLMProvider provider;
        private final String decryptedApiKey;
        private final String modelName;
        private final String baseUrl;
        private final String providerType;
        private final boolean isDemoMode;

        public ActiveLLMContext(LLMProvider provider, String decryptedApiKey, String modelName, String baseUrl, String providerType, boolean isDemoMode) {
            this.provider = provider;
            this.decryptedApiKey = decryptedApiKey;
            this.modelName = modelName;
            this.baseUrl = baseUrl;
            this.providerType = providerType;
            this.isDemoMode = isDemoMode;
        }

        public LLMProvider getProvider() { return provider; }
        public String getDecryptedApiKey() { return decryptedApiKey; }
        public String getModelName() { return modelName; }
        public String getBaseUrl() { return baseUrl; }
        public String getProviderType() { return providerType; }
        public boolean isDemoMode() { return isDemoMode; }
    }
}
