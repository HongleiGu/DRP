package com.echospace.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.echospace.model.messages.RoomCreationRequest;

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
    List<String> getMembersByRoomId(@Param("roomId") String roomId);

    String createRoom(RoomCreationRequest req);

    String getRoom(@Param("roomId") String roomId);

    void insertUsersToRoom(@Param("userId") String userId, @Param("roomId") String roomId);
}
