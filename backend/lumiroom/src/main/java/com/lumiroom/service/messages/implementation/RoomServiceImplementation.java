package com.lumiroom.service.messages.implementation;

import com.lumiroom.mapper.RoomMapper;
import com.lumiroom.model.commons.User;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.model.rooms.RoomCreationRequest;
import com.lumiroom.model.rooms.RoomWithMembers;
// import com.lumiroom.model.rooms.RoomStatus;
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
     * Returns all member in the given room.
     */
    @Override
    public List<User> getRoomMembers(String roomId) {
        return roomMapper.getMembersByRoomId(roomId);
    }

    public boolean checkUserInRoom(String userId, String roomId) {
        boolean result = false;
        for (User it : roomMapper.getMembersByRoomId(roomId)) {
            if (it.getId().equals(userId)) {
                result = true;
                break;
            }
        }
        return result;
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
        roomMapper.deleteUsersFromRoom(userId, roomId);
    }

    @Override
    public void deleteRoom(String roomId) {
        roomMapper.deleteRoom(roomId);
    }

    @Override
    public List<Room> getAllRoomsofUser(String userId) {
        return roomMapper.getAllRoomsofUser(userId);
    }

    // @Override
    // public void changeRoomStatus(String roomId, RoomStatus status) {
    // roomMapper.changeRoomStatus(roomId, status);
    // }
}
