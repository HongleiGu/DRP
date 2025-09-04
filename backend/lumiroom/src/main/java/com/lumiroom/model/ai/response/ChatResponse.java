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
  private String model;
  private Message message; // incremental in streaming, full otherwise
  private Boolean done;
  private String created_at;

  // Stats present on final chunk
  private Long total_duration;
  private Long load_duration;
  private Integer prompt_eval_count;
  private Integer eval_count;
  private Long eval_duration;
  private String done_reason;
  private Long prompt_eval_duration;
}
