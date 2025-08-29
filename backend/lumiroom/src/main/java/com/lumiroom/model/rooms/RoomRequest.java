package com.lumiroom.model.rooms;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class RoomRequest {
  private String userId;
  private String roomId;
}
