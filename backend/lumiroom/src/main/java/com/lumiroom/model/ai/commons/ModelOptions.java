package com.lumiroom.model.ai.commons;

import lombok.*;
import java.util.List;

/**
 * Shared generation options for Ollama.
 * Jackson will map camelCase → snake_case automatically.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelOptions {
  private Double temperature; // → temperature
  private Double topP; // → top_p
  private Integer topK; // → top_k
  private Integer numPredict; // → num_predict
  private Integer seed; // → seed
  private List<String> stop; // → stop
}
