// src/main/java/com/example/controller/MessageController.java
package com.lumiroom.lumiroom.controller;

import com.lumiroom.lumiroom.model.commons.Result;
import com.lumiroom.lumiroom.model.commons.User;
import com.lumiroom.lumiroom.model.game.PlayerData;
import com.lumiroom.lumiroom.model.messages.Message;
import com.lumiroom.lumiroom.model.messages.RoomCreationRequest;
import com.lumiroom.lumiroom.service.auth.AuthService;
import com.lumiroom.lumiroom.service.game.GameService;
import com.lumiroom.lumiroom.service.messages.RedisService;
import com.lumiroom.lumiroom.service.messages.RoomService;
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
    private final GameService gameService;
    private final AuthService authService;

    @Autowired
    private RedisService redisService;

    public MessageController(Sender sender, RoomService roomService, GameService gameService, AuthService authService) {
        this.sender = sender;
        this.roomService = roomService;
        this.gameService = gameService;
        this.authService = authService;
    }

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("springboot is running");
    }

    /**
     * Sends a message to a specific user within a room.
     *
     * @param userId         the target user UUID
     * @param roomId         the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = { "userId" })
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
     * @param roomId         the room ID
     * @param messageRequest the message content
     */
    @PostMapping(params = "roomId")
    public Result<String> sendToRoom(
            @RequestParam String roomId,
            @RequestBody Message messageRequest) {
        try {
            List<String> users = roomService.getRoomMembers(roomId);

            // if the room is empty, return a 404
            if (users == null || users.isEmpty()) {
                return Result
                        .error("No members found in room " + roomId);
            }

            for (String userId : users) {
                String routingKey = String.format("%s.%s.msg", roomId, userId);
                sender.send(routingKey, messageRequest);
            }

            return Result.success("Message sent to room " + roomId);
        } catch (Throwable e) {
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
        } catch (Throwable e) {
            return Result.error("Delete Failed");
        }
    }

    @DeleteMapping("/deleteMessage")
    public Result<String> deleteMessage(@RequestParam String userId, @RequestParam String roomId) {
        try {
            redisService.deleteMessages(userId, roomId);
            return Result.success("Deleted");
        } catch (Throwable e) {
            return Result.error("Delete Failed");
        }
    }

    @GetMapping("/checkRoom")
    public Result<Boolean> checkRoom(@RequestParam String roomId) {
        try {
            String id = roomService.getRoom(roomId);
            List<String> members = roomService.getRoomMembers(roomId);
            if (members.size() == 0 && id == null) {
                return Result.success(false, "the room does not exist");
            } else if (members.size() == 0 && id != null) {
                return Result.success(true, "the room exists, but there are no members in it");
            }
            return Result.success(true, "the room exists");
        } catch (Throwable e) {
            return Result.error(500, "an error occured when check room: " + e.getMessage());
        }
    }

    @PostMapping("/createRoom")
    public Result<String> createRoom(@RequestBody RoomCreationRequest req) {
        try {
            return Result.success(
                    roomService.createRoom(req),
                    "room creation success");
        } catch (Throwable e) {
            return Result.error("room creation failed due to: " + e.getMessage());
        }
    }

    @PostMapping("/insertUserToRoom")
    public Result<String> insertUsersToRoom(@RequestParam String userId, @RequestParam String roomId) {
        try {
            roomService.insertUserToRoom(userId, roomId);
            User user = authService.findUserById(userId);
            gameService.updatePlayerData(user, roomId, 200, 300);
            return Result.success("successfully inserted users to room", "successfully inserted users to room");
        } catch (Throwable e) {
            return Result.error("inserting user to room failed due to: " + e.getMessage());
        }
    }
}
