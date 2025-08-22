package com.lumiroom.controller;

import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.model.commons.Result;
import com.lumiroom.model.game.PlayerData;
import com.lumiroom.service.game.GameService;
import com.lumiroom.service.messages.RoomService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Controller handling real-time multiplayer game actions and REST API
 * endpoints.
 * <p>
 * This controller supports both:
 * <ul>
 * <li>WebSocket-based position updates (using STOMP protocol)</li>
 * <li>HTTP endpoints for retrieving and updating player data</li>
 * </ul>
 * <p>
 * The base REST path is {@code /api/game}, while WebSocket messages are handled
 * via
 * the configured STOMP broker mappings.
 * <p>
 * Responsibilities:
 * <ul>
 * <li>Broadcasting player position updates to other players in the same
 * room</li>
 * <li>Validating player-room membership before broadcasting</li>
 * <li>Providing room player lists</li>
 * <li>Persisting player state changes</li>
 * </ul>
 *
 * <b>Security considerations:</b>
 * <ul>
 * <li>Room membership checks are enforced before broadcasting data.</li>
 * <li>WebSocket authentication/authorization should be configured at the broker
 * level.</li>
 * <li>REST endpoints should be protected via authentication and role
 * checks.</li>
 * </ul>
 *
 * @author Honglei Gu
 * @since 1.0
 */
@RestController
@RequestMapping("/api/game")
public class GameController {

  private final SimpMessagingTemplate messagingTemplate;
  private final RoomService roomService;
  private final GameService gameService;

  /**
   * Constructs a new {@code GameController}.
   *
   * @param messagingTemplate the Spring messaging template for sending
   *                          STOMP/WebSocket messages
   * @param roomService       service for managing and validating game room
   *                          membership
   * @param gameService       service for managing game state and player data
   */
  public GameController(SimpMessagingTemplate messagingTemplate, RoomService roomService, GameService gameService) {
    this.messagingTemplate = messagingTemplate;
    this.roomService = roomService;
    this.gameService = gameService;
  }

  /**
   * Receives and broadcasts player position updates to all players in the same
   * room.
   * <p>
   * This is a WebSocket (STOMP) endpoint that listens for messages sent to
   * {@code /app/broadcastPosition} and publishes them to
   * {@code /topic/room/{roomId}} for all subscribed clients.
   * <p>
   * The method will ignore messages if:
   * <ul>
   * <li>{@code userId} is null</li>
   * <li>The player is not a member of the specified room</li>
   * </ul>
   *
   * @param positionMessage a {@link PlayerData} object containing:
   *                        <ul>
   *                        <li>{@code userId} – unique player identifier</li>
   *                        <li>{@code roomId} – the target room to broadcast
   *                        to</li>
   *                        <li>Position/state data for the player</li>
   *                        </ul>
   */
  @MessageMapping("/updatePlayerPosition")
  public void updatePosition(@Payload PlayerData positionMessage) {
    String userId = positionMessage.getUserId();
    if (userId == null) {
      return;
    }

    String roomId = positionMessage.getRoomId();

    // Validate room membership
    if (!roomService.checkUserInRoom(userId, roomId)) {
      // Unauthorized: ignore the update
      return;
    }

    // Broadcast to all subscribers in the room
    messagingTemplate.convertAndSend("/topic/room/" + roomId, positionMessage);
    // TODO: Persist update to database if required
  }

  /**
   * Retrieves a list of all players currently in a specified room.
   *
   * @param roomId the ID of the room whose players should be retrieved
   * @return a {@link Result} containing:
   *         <ul>
   *         <li>List of {@link PlayerData} for each player in the room</li>
   *         <li>Error result if the query fails</li>
   *         </ul>
   */
  @GetMapping("/getPlayers")
  public Result<List<PlayerData>> getPlayersInRoom(@RequestBody String roomId) {
    try {
      return Result.success(gameService.getPlayersInRoom(roomId));
    } catch (Throwable e) {
      return Result.error(500, "failed to get player data");
    }
  }

  /**
   * Updates the data for a player and broadcasts the new position/state to other
   * players.
   * <p>
   * This endpoint:
   * <ul>
   * <li>Updates the player's data in the {@link GameService}</li>
   * <li>Immediately broadcasts the change via WebSocket to other room
   * members</li>
   * </ul>
   *
   * @param data a {@link PlayerData} object containing updated player information
   * @return a {@link Result} containing:
   *         <ul>
   *         <li>Success message if the update was applied and broadcast</li>
   *         <li>Error result if an exception occurred</li>
   *         </ul>
   */
  @PostMapping("/updatePlayerData")
  public Result<String> updatePlayerData(@RequestBody PlayerData data) {
    try {
      gameService.updatePlayerData(data);
      updatePosition(data); // Broadcast update
      return Result.success("update success", "update success");
    } catch (Throwable e) {
      return Result.error(500, "update failed due to: " + e.getMessage());
    }
  }
}
