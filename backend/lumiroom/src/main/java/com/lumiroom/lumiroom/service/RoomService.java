package com.lumiroom.lumiroom.service;

import com.lumiroom.lumiroom.mapper.RoomMapper;
import com.lumiroom.lumiroom.model.RoomMember;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service to interact with room membership data.
 */
@Service
public class RoomService {
    
    private RoomMapper roomMapper;

    public RoomService(RoomMapper roomMapper) {
        this.roomMapper = roomMapper;
    }

    /**
     * Returns all member IDs in the given room.
     */
    public List<RoomMember> getRoomMembers(String roomId) {
        return roomMapper.getMembersByRoomId(roomId);
    }
}
