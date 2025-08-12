package com.lumiroom.lumiroom.controller;

import com.lumiroom.lumiroom.model.commons.Result;
import com.lumiroom.lumiroom.model.commons.User;
import com.lumiroom.lumiroom.model.game.PlayerData;
import com.lumiroom.lumiroom.model.messages.Message;
import com.lumiroom.lumiroom.model.messages.RoomCreationRequest;
import com.lumiroom.lumiroom.model.messages.UserInsertionBatchedRequest;
import com.lumiroom.lumiroom.model.messages.UserInsertionRequest;
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
 * REST controller providing APIs for messaging and room management in the
 * Lumiroom application.
 * <p>
 * This controller supports:
 * <ul>
 * <li>Sending messages to specific users or all members in a room via
 * RabbitMQ</li>
 * <li>Retrieving and deleting stored messages from Redis</li>
 * <li>Room existence checks, creation, and user insertion</li>
 * <li>Updating in-game player state when users join rooms</li>
 * </ul>
 * 
 * <b>Key components:</b>
 * <ul>
 * <li>{@link Sender} – Publishes messages to RabbitMQ exchanges with specific
 * routing keys.</li>
 * <li>{@link RoomService} – Manages room metadata and membership lists.</li>
 * <li>{@link RedisService} – Caches and retrieves message history.</li>
 * <li>{@link GameService} – Updates player positions/states upon room
 * joining.</li>
 * <li>{@link AuthService} – Retrieves user details for room operations.</li>
 * </ul>
 *
 * <b>Profile restriction:</b>
 * This controller is active only when the {@code sender} Spring profile is
 * enabled.
 * 
 * <b>Security considerations:</b>
 * <ul>
 * <li>Message sending should be rate-limited to prevent spam.</li>
 * <li>Room membership and permissions should be verified before sending
 * messages.</li>
 * <li>Message content should be sanitized to prevent XSS in clients.</li>
 * </ul>
 * 
 * Base path: {@code /api/message}
 * 
 * @author Honglei Gu
 * @since 1.0
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

    /**
     * Constructs a new {@code MessageController}.
     *
     * @param sender      service for sending RabbitMQ messages
     * @param roomService service for managing rooms and memberships
     * @param gameService service for updating game state
     * @param authService service for user authentication and lookup
     */
    public MessageController(Sender sender, RoomService roomService, GameService gameService, AuthService authService) {
        this.sender = sender;
        this.roomService = roomService;
        this.gameService = gameService;
        this.authService = authService;
    }

    /**
     * Health check endpoint to verify that the Spring Boot service is running.
     *
     * @return a {@link Result} containing a success message
     */
    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("springboot is running");
    }

    /**
     * Sends a message to a specific user within a room.
     * <p>
     * The routing key format is: {@code *.<userId>.msg}.
     *
     * @param userId         the UUID of the target user
     * @param messageRequest the message payload
     * @return a {@link Result} with a success confirmation
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
     * Sends a message to all members of a specified room.
     * <p>
     * The routing key format for each user is: {@code <roomId>.<userId>.msg}.
     * 
     * @param roomId         the room ID
     * @param messageRequest the message payload
     * @return a {@link Result} indicating success or failure
     */
    @PostMapping(params = "roomId")
    public Result<String> sendToRoom(
            @RequestParam String roomId,
            @RequestBody Message messageRequest) {
        try {
            List<String> users = roomService.getRoomMembers(roomId);
            if (users == null || users.isEmpty()) {
                return Result.error("No members found in room " + roomId);
            }
            for (String userId : users) {
                String routingKey = String.format("%s.%s.msg", roomId, userId);
                sender.send(routingKey, messageRequest);
            }
            return Result.success("Message sent to room " + roomId);
        } catch (Throwable e) {
            return Result.error("A server side error occurred: " + e.getMessage());
        }
    }

    /**
     * Retrieves all messages for a specific user from Redis.
     *
     * @param userId the UUID of the target user
     * @return a {@link Result} containing a list of {@link Message} objects
     */
    @GetMapping("/getMessages")
    public Result<List<Message>> getMessages(@RequestParam String userId) {
        return Result.success(redisService.getMessages(userId));
    }

    /**
     * Retrieves messages for a user from a specific room.
     *
     * @param userId the UUID of the target user
     * @param roomId the ID of the room
     * @return a {@link Result} containing a list of {@link Message} objects
     */
    @GetMapping("/getMessage")
    public Result<List<Message>> getMessage(@RequestParam String userId, @RequestParam String roomId) {
        return Result.success(redisService.getMessages(userId, roomId));
    }

    /**
     * Deletes all messages for a given user.
     *
     * @param userId the UUID of the target user
     * @return a {@link Result} confirming deletion
     */
    @DeleteMapping("/deleteMessages")
    public Result<String> deleteMessages(@RequestParam String userId) {
        try {
            redisService.deleteMessages(userId);
            return Result.success("Deleted");
        } catch (Throwable e) {
            return Result.error("Delete Failed");
        }
    }

    /**
     * Deletes all messages for a given user in a specific room.
     *
     * @param userId the UUID of the target user
     * @param roomId the ID of the room
     * @return a {@link Result} confirming deletion
     */
    @DeleteMapping("/deleteMessage")
    public Result<String> deleteMessage(@RequestParam String userId, @RequestParam String roomId) {
        try {
            redisService.deleteMessages(userId, roomId);
            return Result.success("Deleted");
        } catch (Throwable e) {
            return Result.error("Delete Failed");
        }
    }

    /**
     * Checks whether a room exists and whether it contains members.
     *
     * @param roomId the ID of the room
     * @return a {@link Result} with:
     *         <ul>
     *         <li>{@code false} if the room does not exist</li>
     *         <li>{@code true} with a message indicating if the room is empty or
     *         populated</li>
     *         </ul>
     */
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
            return Result.error(500, "an error occurred when checking room: " + e.getMessage());
        }
    }

    /**
     * Creates a new room.
     *
     * @param req a {@link RoomCreationRequest} containing room metadata
     * @return a {@link Result} containing the created room ID on success
     */
    @PostMapping("/createRoom")
    public Result<String> createRoom(@RequestBody RoomCreationRequest req) {
        try {
            return Result.success(roomService.createRoom(req), "room creation success");
        } catch (Throwable e) {
            return Result.error("room creation failed due to: " + e.getMessage());
        }
    }

    /**
     * Inserts a single user into a room and updates their in-game player state.
     *
     * @param req a {@link UserInsertionRequest} containing user and room IDs
     * @return a {@link Result} confirming success or reporting failure
     */
    @PostMapping("/insertUserToRoom")
    public Result<String> insertUsersToRoom(@RequestBody UserInsertionRequest req) {
        try {
            String userId = req.getUserId();
            String roomId = req.getRoomId();
            roomService.insertUserToRoom(userId, roomId);
            User user = authService.findUserById(userId);
            gameService.updatePlayerData(user, roomId, 200, 300);
            return Result.success("successfully inserted user to room", "successfully inserted user to room");
        } catch (Throwable e) {
            return Result.error("inserting user to room failed due to: " + e.getMessage());
        }
    }

    /**
     * Inserts multiple users into a room in a batch operation and updates each
     * user's game state.
     *
     * @param req a {@link UserInsertionBatchedRequest} containing a list of user
     *            IDs and the target room ID
     * @return a {@link Result} confirming success or reporting failure
     */
    @PostMapping("/insertUsersToRoomBatched")
    public Result<String> insertUsersToRoomBatched(@RequestBody UserInsertionBatchedRequest req) {
        try {
            List<String> userIds = req.getUserIds();
            String roomId = req.getRoomId();
            for (String id : userIds) {
                roomService.insertUserToRoom(id, roomId);
                User user = authService.findUserById(id);
                gameService.updatePlayerData(user, roomId, 200, 300);
            }
            return Result.success("successfully inserted users to room", "successfully inserted users to room");
        } catch (Throwable e) {
            return Result.error("inserting users to room failed due to: " + e.getMessage());
        }
    }
}
