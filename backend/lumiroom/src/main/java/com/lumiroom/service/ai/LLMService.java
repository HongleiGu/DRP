package com.lumiroom.service.ai;

import com.lumiroom.model.ai.request.*;
import com.lumiroom.model.ai.response.*;
import com.lumiroom.service.ai.provider.LLMProvider;
import com.lumiroom.service.ai.provider.ProviderFactory;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
public class LLMService {

    private final ProviderFactory providerFactory;

    public LLMService(ProviderFactory providerFactory) {
        this.providerFactory = providerFactory;
    }

    public Flux<GenerateResponse> generate(GenerateRequest request) {
        LLMProvider provider = providerFactory.getProvider(request.getProvider());

        if (request.getStream()) {
            return provider.generateResponseStream(request)
                    .subscribeOn(Schedulers.boundedElastic()); // ensures reactive execution
        } else {
            return Flux.defer(() -> Flux.just(provider.generateResponse(request)))
                    .subscribeOn(Schedulers.boundedElastic()); // offloads blocking RestTemplate
        }
    }

    public Flux<ChatResponse> chat(ChatRequest request) {
        LLMProvider provider = providerFactory.getProvider(request.getProvider());

        if (request.getStream()) {
            return provider.chatResponseStream(request)
                    .subscribeOn(Schedulers.boundedElastic());
        } else {
            return Flux.defer(() -> Flux.just(provider.chatResponse(request)))
                    .subscribeOn(Schedulers.boundedElastic());
        }
    }
}
