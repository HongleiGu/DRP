package com.lumiroom.service.messages.implementation;

import com.lumiroom.mapper.RoomMapper;
import com.lumiroom.model.messages.Room;
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

    public boolean checkUserInRoom(String userId, String roomId) {
        return roomMapper.getMembersByRoomId(roomId).contains(userId);
    }

    public String createRoom(RoomCreationRequest req) {
        return roomMapper.createRoom(req);
    }

    public Room getRoom(String roomId) {
        return roomMapper.getRoom(roomId);
    }

    @Override
    public void insertUserToRoom(String userId, String roomId) {
        roomMapper.insertUsersToRoom(userId, roomId);
    }

    @Override
    public void deleteUserFromRoom(String userId, String roomId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteUserFromRoom'");
    }
}
