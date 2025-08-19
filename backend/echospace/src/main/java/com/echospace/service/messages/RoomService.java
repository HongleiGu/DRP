package com.echospace.service.messages;

import java.util.List;

import com.echospace.model.messages.RoomCreationRequest;

/**
 * Service to interact with room membership data.
 */
public interface RoomService {

  /**
   * get the members in the room
   * 
   * @param roomId
   * @return
   */
  public List<String> getRoomMembers(String roomId);

  public boolean checkUserInRoom(String userId, String roomId);

  public String createRoom(RoomCreationRequest req);

  public String getRoom(String roomId);

  public void insertUserToRoom(String userId, String roomId);
}
