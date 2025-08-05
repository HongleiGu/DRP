package com.lumiroom.lumiroom.service.auth;

import com.lumiroom.lumiroom.model.RoomMember;

import java.util.List;

/**
 * Service to interact with room membership data.
 */
public interface RoomService {

  /**
   * get the members in the room
   * @param roomId
   * @return
   */
  public List<RoomMember> getRoomMembers(String roomId);
}
