// src/main/java/com/example/controller/MessageController.java
package com.lumiroom.lumiroom.controller;

import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.model.RoomMember;
import com.lumiroom.lumiroom.service.RedisService;
import com.lumiroom.lumiroom.service.RoomService;
import com.lumiroom.lumiroom.service.sender.Sender;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


/**
 * Provides REST APIs for sending messages to users or rooms.
 */
@RestController
@Profile("sender")
@RequestMapping("/api/message")
public class MessageController {

    
    private final Sender sender;
    private final RoomService roomService;

    @Autowired
    private RedisService redisService;

    public MessageController(Sender sender, RoomService roomService) {
      this.sender = sender;
      this.roomService = roomService;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("springboot is running");
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

    @GetMapping("/getMessages")
    public ResponseEntity<List<Message>> getMessages(@RequestParam String userId) {
        return ResponseEntity.ok(redisService.getMessages(userId));
    }

    @GetMapping("/getMessage")
    public ResponseEntity<List<Message>> getMessage(@RequestParam String userId, @RequestParam String roomId) {
        return ResponseEntity.ok(redisService.getMessages(userId, roomId));
    }
    
    @DeleteMapping("/deleteMessages")
    public ResponseEntity<String> deleteMessages(@RequestParam String userId) {
        try {
            redisService.deleteMessages(userId);
            return ResponseEntity.ok("Deleted");
        } catch (Error e) {
            return ResponseEntity.status(500).body("Failed");
        }
    }

    @DeleteMapping("/deleteMessage")
    public ResponseEntity<String> deleteMessage(@RequestParam String userId, @RequestParam String roomId) {
        try {
            redisService.deleteMessages(userId, roomId);
            return ResponseEntity.ok("Deleted");
        } catch (Error e) {
            return ResponseEntity.status(500).body("Failed");
        }
    }
}
