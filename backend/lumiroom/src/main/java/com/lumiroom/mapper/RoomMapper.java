package com.lumiroom.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.lumiroom.model.commons.User;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.model.rooms.RoomCreationRequest;

import java.util.List;

/**
 * Mapper for accessing room membership data.
 */
@Mapper
public interface RoomMapper {

    /**
     * Get all members for a specific room.
     * 
     * @param roomId UUID of the room
     * @return List of RoomMember objects
     */
    List<User> getMembersByRoomId(@Param("roomId") String roomId);

    String createRoom(RoomCreationRequest req);

    Room getRoom(@Param("roomId") String roomId);

    void insertUsersToRoom(@Param("userId") String userId, @Param("roomId") String roomId);

    void deleteUsersFromRoom(@Param("userId") String userId, @Param("roomId") String roomId);

    void deleteRoom(String roomId);

    List<Room> getAllRoomsofUser(String userId);
}
