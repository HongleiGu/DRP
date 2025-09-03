package com.lumiroom.service.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiroom.model.ai.commons.Message;
import com.lumiroom.model.ai.request.*;
import com.lumiroom.model.ai.response.*;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component("ollamaProvider")
public class OllamaProvider implements LLMProvider {

    private static final String BASE_URL = "http://ollama-gpu:11434";
    private static final String DEFAULT_MODEL = "qwen3:latest";

    private final RestTemplate restTemplate;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final Duration timeout = Duration.ofMinutes(5);

    public OllamaProvider() {
        this.restTemplate = new RestTemplate();
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public GenerateResponse generateResponse(GenerateRequest request) {
        String model = request.getModel() != null ? request.getModel() : DEFAULT_MODEL;

        Map<String, Object> body = Map.of(
                "model", model,
                "prompt", request.getPrompt(),
                "stream", false);

        var entity = new org.springframework.http.HttpEntity<>(body);

        var responseEntity = restTemplate.postForEntity(
                BASE_URL + "/api/generate",
                entity,
                String.class);

        String responseBody = responseEntity.getBody();
        if (responseBody == null || responseBody.isEmpty()) {
            return GenerateResponse.builder().build();
        }

        try {
            Map<String, Object> jsonMap = objectMapper.readValue(responseBody, Map.class);
            String text = (String) jsonMap.getOrDefault("response", "");
            Boolean done = (Boolean) jsonMap.getOrDefault("done", true);
            Integer promptEvalCount = (Integer) jsonMap.getOrDefault("prompt_eval_count", 0);
            Integer evalCount = (Integer) jsonMap.getOrDefault("eval_count", 0);

            return GenerateResponse.builder()
                    .response(text)
                    .done(done)
                    .promptEvalCount(promptEvalCount)
                    .evalCount(evalCount)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Ollama response", e);
        }
    }

    public Flux<GenerateResponse> generateResponseStream(GenerateRequest request) {
        Map<String, Object> body = Map.of(
                "model", request.getModel() != null ? request.getModel() : DEFAULT_MODEL,
                "prompt", request.getPrompt(),
                "stream", true);

        return webClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.valueOf("application/x-ndjson"))
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.isError(),
                        resp -> resp.createException()
                                .map(e -> new RuntimeException("Ollama API error: " + e.getMessage(), e)))
                .bodyToFlux(GenerateResponse.class)
                .timeout(timeout)
                .onErrorMap(throwable -> new RuntimeException("Ollama request timed out", throwable))
                .filter(line -> line.getResponse() != null && !line.getResponse().trim().isEmpty());
    }

    @Override
    public ChatResponse chatResponse(ChatRequest request) {
        String model = request.getModel() != null ? request.getModel() : DEFAULT_MODEL;

        List<Map<String, String>> messagesPayload = request
                .getMessages()
                .stream()
                .map(msg -> Map.of("role", msg.getRole(), "content", msg.getContent()))
                .toList();

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messagesPayload,
                "stream", false);

        var entity = new org.springframework.http.HttpEntity<>(body);

        var responseEntity = restTemplate.postForEntity(
                BASE_URL + "/api/chat",
                entity,
                String.class);

        String responseBody = responseEntity.getBody();
        if (responseBody == null || responseBody.isEmpty()) {
            return ChatResponse.builder().build();
        }

        try {
            Map<String, Object> jsonMap = objectMapper.readValue(responseBody, Map.class);
            Map<String, Object> messageMap = (Map<String, Object>) jsonMap.getOrDefault("message", Map.of());

            String content = (String) messageMap.getOrDefault("content", "");
            String role = (String) messageMap.getOrDefault("role", "assistant");
            Boolean done = (Boolean) jsonMap.getOrDefault("done", true);
            Integer promptEvalCount = (Integer) jsonMap.getOrDefault("prompt_eval_count", 0);
            Integer evalCount = (Integer) jsonMap.getOrDefault("eval_count", 0);

            Message message = Message.builder()
                    .role(role)
                    .content(content)
                    .build();

            return ChatResponse.builder()
                    .message(message)
                    .done(done)
                    .promptEvalCount(promptEvalCount)
                    .evalCount(evalCount)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Ollama chat response", e);
        }
    }

    @Override
    public Flux<ChatResponse> chatResponseStream(ChatRequest request) {
        String model = request.getModel() != null ? request.getModel() : DEFAULT_MODEL;

        List<Map<String, String>> messagesPayload = request.getMessages().stream()
                .map(msg -> Map.of("role", msg.getRole(), "content", msg.getContent()))
                .toList();

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messagesPayload,
                "stream", true);

        return webClient.post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.valueOf("application/x-ndjson"))
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.isError(),
                        resp -> resp.createException()
                                .map(e -> new RuntimeException("Ollama API error: " + e.getMessage(), e)))
                .bodyToFlux(ChatResponse.class)
                .timeout(timeout)
                .onErrorMap(throwable -> new RuntimeException("Ollama request timed out", throwable))
                .filter(line -> line.getMessage() != null
                        && line.getMessage().getContent() != null
                        && !line.getMessage().getContent().trim().isEmpty());
    }
}
