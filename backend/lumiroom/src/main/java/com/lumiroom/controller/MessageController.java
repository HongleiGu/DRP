package com.lumiroom.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.lumiroom.model.commons.Result;
import com.lumiroom.model.commons.User;
import com.lumiroom.model.contacts.Contacts;
import com.lumiroom.model.messages.Message;
import com.lumiroom.model.messages.MessageType;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.model.rooms.RoomCreationRequest;
import com.lumiroom.model.rooms.RoomRequest;
import com.lumiroom.model.rooms.RoomRequestBatched;
import com.lumiroom.service.auth.AuthService;
import com.lumiroom.service.game.GameService;
import com.lumiroom.service.messages.ContactsService;
import com.lumiroom.service.messages.RedisService;
import com.lumiroom.service.messages.RoomService;
import com.lumiroom.service.rabbitmq.Sender;
import com.lumiroom.utils.Utils;

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
@CrossOrigin
@RequestMapping("/api/message")

public class MessageController {

    @Autowired
    private Sender sender;

    @Autowired
    private RoomService roomService;

    @Autowired
    private ContactsService contactsService;

    @Autowired
    private RedisService redisService;

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
            List<User> users = roomService.getRoomMembers(roomId);
            if (users == null || users.isEmpty()) {
                return Result.error("No members found in room " + roomId);
            }
            if (!users.stream().anyMatch(user -> user.getId().equals(messageRequest.getSpeaker()))) {
                return Result.error("You cannot send a message to a room you are not in");
            }
            for (User user : users) {
                String routingKey = String.format("%s.%s.msg", roomId, user.getId());
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
}
