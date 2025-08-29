package com.lumiroom.model.rooms;

import java.time.LocalDateTime;
import java.util.List;

import com.lumiroom.model.commons.User;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// this is the room that we should return to the frontend, with the memebers
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomWithMembers {
  private String id;
  private String name;
  private String creatorId;
  private LocalDateTime createdAt;
  private RoomType type;
  private List<User> members;

  public RoomWithMembers(Room room, List<User> users) {
    this.id = room.getId();
    this.name = room.getName();
    this.creatorId = room.getCreatorId();
    this.createdAt = room.getCreatedAt();
    this.type = room.getType();
    this.members = users;
  }
}
