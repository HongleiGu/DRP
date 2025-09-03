package com.lumiroom.model.ai.response;

import com.lumiroom.model.ai.commons.Message;

import lombok.*;

/**
 * Neutral response for chat-based APIs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
  private Message message; // incremental in streaming, full otherwise
  private Boolean done;

  // Stats present on final chunk
  private Long totalDuration;
  private Long loadDuration;
  private Integer promptEvalCount;
  private Integer evalCount;
}
