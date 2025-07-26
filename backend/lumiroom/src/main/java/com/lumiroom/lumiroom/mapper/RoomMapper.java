package com.lumiroom.lumiroom.mapper;

import com.lumiroom.lumiroom.model.RoomMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Mapper for accessing room membership data.
 */
@Mapper
public interface RoomMapper {

    /**
     * Get all members for a specific room.
     * @param roomId UUID of the room
     * @return List of RoomMember objects
     */
    List<RoomMember> getMembersByRoomId(@Param("roomId") String roomId);
}
