package com.lumiroom.model.ai.request;

import lombok.*;

import com.lumiroom.model.ai.commons.ModelOptions;
import com.lumiroom.model.ai.commons.Provider;

/**
 * Neutral prompt request for any prompt-to-text API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateRequest {
  private String model;
  private Provider provider;
  private String prompt;
  @Builder.Default
  private Boolean stream = Boolean.TRUE;
  private ModelOptions options;
}
