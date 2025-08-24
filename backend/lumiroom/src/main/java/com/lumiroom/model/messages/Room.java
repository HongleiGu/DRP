package com.lumiroom.model.messages;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Room {
  private String id;
  private String name;
  private String creatorId;
  private LocalDateTime createdAt;
}