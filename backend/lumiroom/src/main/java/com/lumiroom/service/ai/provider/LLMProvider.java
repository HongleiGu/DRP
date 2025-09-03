package com.lumiroom.service.ai.provider;

import com.lumiroom.model.ai.request.ChatRequest;
import com.lumiroom.model.ai.request.GenerateRequest;
import com.lumiroom.model.ai.response.ChatResponse;
import com.lumiroom.model.ai.response.GenerateResponse;
import reactor.core.publisher.Flux;

public interface LLMProvider {

  // Synchronous generation
  GenerateResponse generateResponse(GenerateRequest request);

  // Synchronous chat
  ChatResponse chatResponse(ChatRequest request);

  // Streaming generation
  Flux<GenerateResponse> generateResponseStream(GenerateRequest request);

  // Streaming chat
  Flux<ChatResponse> chatResponseStream(ChatRequest request);
}
