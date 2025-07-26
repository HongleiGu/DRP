// src/main/java/com/example/controller/MessageController.java
package com.lumiroom.lumiroom.controller;

import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.model.RoomMember;
import com.lumiroom.lumiroom.service.RoomService;
import com.lumiroom.lumiroom.service.sender.Sender;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Provides REST APIs for sending messages to users or rooms.
 */
@RestController
@Profile("sender")
@RequestMapping("/api/message")
public class MessageController {

    
    private final Sender sender;
    private final RoomService roomService;

    public MessageController(Sender sender, RoomService roomService) {
      this.sender = sender;
      this.roomService = roomService;
    }

    /**
     * Sends a message to a specific user within a room.
     *
     * @param userId        the target user UUID
     * @param roomId        the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = {"userId"})
    public ResponseEntity<String> sendToUser(
            @RequestParam String userId,
            @RequestBody Message messageRequest) {

        String routingKey = String.format("*.%s.msg", userId);
        sender.send(routingKey, messageRequest);
        return ResponseEntity.ok("Message sent to user " + userId);
    }

    /**
     * Sends a message to all users in a room.
     * Simulates DB fetch with a static list of userIds.
     *
     * @param roomId        the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = "roomId")
    public ResponseEntity<String> sendToRoom(
            @RequestParam String roomId,
            @RequestBody Message messageRequest) {

        List<RoomMember> users = roomService.getRoomMembers(roomId);

        // if the room is empty, return a 404
        if (users == null || users.isEmpty()) {
            return ResponseEntity
                .status(404)
                .body("No members found in room " + roomId);
        }
        
        for (RoomMember userId : users) {
            String routingKey = String.format("%s.%s.msg", roomId, userId.getMemberId());
            sender.send(routingKey, messageRequest);
        }

        return ResponseEntity.ok("Message sent to room " + roomId);
    }
}
