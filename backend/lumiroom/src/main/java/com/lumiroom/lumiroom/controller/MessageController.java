// src/main/java/com/example/controller/MessageController.java
package com.lumiroom.lumiroom.controller;

import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.model.Result;
import com.lumiroom.lumiroom.model.RoomMember;
import com.lumiroom.lumiroom.service.auth.RoomService;
import com.lumiroom.lumiroom.service.messages.RedisService;
import com.lumiroom.lumiroom.service.rabbitmq.Sender;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
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

    @Autowired
    private RedisService redisService;

    public MessageController(Sender sender, RoomService roomService) {
      this.sender = sender;
      this.roomService = roomService;
    }

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("springboot is running");
    }

    /**
     * Sends a message to a specific user within a room.
     *
     * @param userId        the target user UUID
     * @param roomId        the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = {"userId"})
    public Result<String> sendToUser(
            @RequestParam String userId,
            @RequestBody Message messageRequest) {

        String routingKey = String.format("*.%s.msg", userId);
        sender.send(routingKey, messageRequest);
        return Result.success("Message sent to user " + userId);
    }

    /**
     * Sends a message to all users in a room.
     * Simulates DB fetch with a static list of userIds.
     * this needs to ensure ACID or else there might be partial sending
     *
     * @param roomId        the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = "roomId")
    public Result<String> sendToRoom(
            @RequestParam String roomId,
            @RequestBody Message messageRequest) {
        try {
            List<RoomMember> users = roomService.getRoomMembers(roomId);

            // if the room is empty, return a 404
            if (users == null || users.isEmpty()) {
                return Result
                    .error("No members found in room " + roomId);
            }
            
            for (RoomMember userId : users) {
                String routingKey = String.format("%s.%s.msg", roomId, userId.getMemberId());
                sender.send(routingKey, messageRequest);
            }

            return Result.success("Message sent to room " + roomId);
        } catch (Exception e) {
            return Result
                    .error("A server side error occured" + e.getMessage());
        }
    }

    @GetMapping("/getMessages")
    public Result<List<Message>> getMessages(@RequestParam String userId) {
        return Result.success(redisService.getMessages(userId));
    }

    @GetMapping("/getMessage")
    public Result<List<Message>> getMessage(@RequestParam String userId, @RequestParam String roomId) {
        return Result.success(redisService.getMessages(userId, roomId));
    }
    
    @DeleteMapping("/deleteMessages")
    public Result<String> deleteMessages(@RequestParam String userId) {
        try {
            redisService.deleteMessages(userId);
            return Result.success("Deleted");
        } catch (Error e) {
            return Result.error("Delete Failed");
        }
    }

    @DeleteMapping("/deleteMessage")
    public Result<String> deleteMessage(@RequestParam String userId, @RequestParam String roomId) {
        try {
            redisService.deleteMessages(userId, roomId);
            return Result.success("Deleted");
        } catch (Error e) {
            return Result.error("Delete Failed");
        }
    }
}
