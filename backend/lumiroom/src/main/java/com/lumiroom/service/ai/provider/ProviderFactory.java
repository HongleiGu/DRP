package com.lumiroom.service.ai.provider;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import com.lumiroom.model.ai.commons.Provider;

@Component
public class ProviderFactory {

    private final ApplicationContext context;

    @Autowired
    public ProviderFactory(ApplicationContext context) {
        this.context = context;
    }

    public LLMProvider getProvider(Provider provider) {
        if (provider == null) {
            throw new IllegalArgumentException("Provider name must be specified");
        }

        switch (provider.toValue()) {
            case "ollama":
                return context.getBean("ollamaProvider", LLMProvider.class);
            case "openai":
                throw new IllegalArgumentException("Openai is yet to support");
            default:
                throw new IllegalArgumentException("Unknown AI provider: " + provider);
        }
    }
}
