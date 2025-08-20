package com.lumiroom.model.messages;

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
}