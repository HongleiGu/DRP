package com.lumiroom.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import com.lumiroom.model.ai.request.*;
import com.lumiroom.model.ai.response.*;
import com.lumiroom.service.ai.LLMService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;

@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final LLMService aiService;

    public AIController(LLMService aiService) {
        this.aiService = aiService;
    }

    /**
     * Generate endpoint supporting both streaming and non-streaming.
     * 
     * @param request The GenerateRequest
     * @return Flux of GenerateResponse objects, even if stream is false, then it
     *         will return a flux with only one object
     */
    @PostMapping(value = "/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<GenerateResponse> generate(
            @RequestBody GenerateRequest request) {
        try {
            return aiService.generate(request);
        } catch (Throwable e) {
            return Flux.error(new RuntimeException("Failed to generate message due to error: " + e.getMessage(), e));
        }
    }

    /**
     * Chat endpoint supporting both streaming and non-streaming.
     * 
     * @param request The ChatRequest
     * @return Flux of ChatResponse objects, even if stream is false, then it
     *         will return a flux with only one object
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ChatResponse> chat(
            @RequestBody ChatRequest request) {
        try {
            return aiService.chat(request)
                    .onErrorResume(e -> Flux.error(new RuntimeException(
                            "Failed to generate message due to error: " + e.getMessage(), e)));
        } catch (Throwable e) {
            return Flux.error(new RuntimeException("Failed to generate message due to error: " + e.getMessage(), e));
        }
    }
}
