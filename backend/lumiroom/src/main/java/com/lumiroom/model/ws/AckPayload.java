package com.lumiroom.model.ws;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@NoArgsConstructor
public class AckPayload {
  private String messageId;
  private boolean success;
}