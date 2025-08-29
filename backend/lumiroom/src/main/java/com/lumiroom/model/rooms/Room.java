package com.lumiroom.model.rooms;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

// this is the room we use in the backend, not passed to frontend
@Data
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Room {
  private String id;
  private String name;
  private String creatorId;
  private LocalDateTime createdAt;
  private RoomType type;
}