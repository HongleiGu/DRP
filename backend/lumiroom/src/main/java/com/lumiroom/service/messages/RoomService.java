package com.lumiroom.service.messages;

import java.util.List;

import com.lumiroom.model.commons.User;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.model.rooms.RoomCreationRequest;
// import com.lumiroom.model.rooms.RoomStatus;
import com.lumiroom.model.rooms.RoomWithMembers;

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
  public List<User> getRoomMembers(String roomId);

  public boolean checkUserInRoom(String userId, String roomId);

  public String createRoom(RoomCreationRequest req);

  public Room getRoom(String roomId);

  public void deleteUserFromRoom(String userId, String roomId);

  public void insertUserToRoom(String userId, String roomId);

  // public void changeRoomStatus(String roomId, RoomStatus status);

  public void deleteRoom(String roomId);

  public List<Room> getAllRoomsofUser(String userId);
}
