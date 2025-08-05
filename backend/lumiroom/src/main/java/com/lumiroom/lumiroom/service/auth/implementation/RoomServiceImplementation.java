package com.lumiroom.lumiroom.service.auth.implementation;

import com.lumiroom.lumiroom.mapper.RoomMapper;
import com.lumiroom.lumiroom.model.RoomMember;
import com.lumiroom.lumiroom.service.auth.RoomService;

import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service to interact with room membership data.
 */
@Service
public class RoomServiceImplementation implements RoomService {
    
    private RoomMapper roomMapper;

    public RoomServiceImplementation(RoomMapper roomMapper) {
        this.roomMapper = roomMapper;
    }

    /**
     * Returns all member IDs in the given room.
     */
    public List<RoomMember> getRoomMembers(String roomId) {
        return roomMapper.getMembersByRoomId(roomId);
    }
}
