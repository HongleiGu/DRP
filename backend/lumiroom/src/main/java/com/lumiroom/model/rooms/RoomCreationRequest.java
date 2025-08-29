package com.lumiroom.model.rooms;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class RoomCreationRequest {
  private String roomName;
  private String creatorId;
  private String type;
}