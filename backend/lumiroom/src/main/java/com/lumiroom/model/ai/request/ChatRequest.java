package com.lumiroom.model.ai.request;

import lombok.*;

import java.util.List;

import com.lumiroom.model.ai.commons.Message;
import com.lumiroom.model.ai.commons.ModelOptions;
import com.lumiroom.model.ai.commons.Provider;

/**
 * Neutral chat request for any message-based LLM API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
  private String model;
  private Provider provider;
  private List<Message> messages;
  @Builder.Default
  private Boolean stream = Boolean.TRUE;
  private ModelOptions options;
}