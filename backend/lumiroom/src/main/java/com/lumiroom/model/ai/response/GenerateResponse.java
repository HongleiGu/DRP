package com.lumiroom.model.ai.response;

import lombok.*;

/**
 * Neutral response for prompt-based APIs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateResponse {
  private String response; // incremental in streaming, full otherwise
  private Boolean done;

  // Stats present on final chunk
  private Long totalDuration;
  private Long loadDuration;
  private Integer promptEvalCount;
  private Integer evalCount;
}