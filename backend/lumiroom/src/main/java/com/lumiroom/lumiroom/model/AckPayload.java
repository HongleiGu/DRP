package com.lumiroom.lumiroom.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AckPayload {
  private String messageId;
  private boolean success;
}