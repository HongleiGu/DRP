package com.lumiroom.service.messages.implementation;

import com.lumiroom.mapper.RoomMapper;
import com.lumiroom.model.messages.RoomCreationRequest;
import com.lumiroom.service.messages.RoomService;

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
    @Override
    public List<String> getRoomMembers(String roomId) {
        return roomMapper.getMembersByRoomId(roomId);
    }

    @Override
    public boolean checkUserInRoom(String userId, String roomId) {
        return roomMapper.getMembersByRoomId(roomId).contains(userId);
    }

    @Override
    public String createRoom(RoomCreationRequest req) {
        return roomMapper.createRoom(req);
    }

    @Override
    public String getRoom(String roomId) {
        return roomMapper.getRoom(roomId);
    }

    @Override
    public void insertUserToRoom(String userId, String roomId) {
        roomMapper.insertUsersToRoom(userId, roomId);
    }
}
