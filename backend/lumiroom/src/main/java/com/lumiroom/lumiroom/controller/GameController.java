package com.lumiroom.lumiroom.controller;

import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.lumiroom.model.commons.Result;
import com.lumiroom.lumiroom.model.game.PlayerData;
import com.lumiroom.lumiroom.service.game.GameService;
import com.lumiroom.lumiroom.service.messages.RoomService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RestController("/api/game")
public class GameController {

  private final SimpMessagingTemplate messagingTemplate;
  private final RoomService roomService;
  private final GameService gameService;

  public GameController(SimpMessagingTemplate messagingTemplate, RoomService roomService, GameService gameService) {
    this.messagingTemplate = messagingTemplate;
    this.roomService = roomService;
    this.gameService = gameService;
  }

  @MessageMapping("/broadcastPosition")
  public void updatePosition(@Payload PlayerData positionMessage) {
    String userId = positionMessage.getUserId();
    if (userId == null)
      return;

    String roomId = positionMessage.getRoomId();

    // Validate user is allowed in this room
    if (!roomService.checkUserInRoom(userId, roomId)) {
      // Unauthorized: ignore or optionally send error message back
      return;
    }

    // Broadcast to all in room
    messagingTemplate.convertAndSend("/topic/room/" + roomId, positionMessage);
    // TODO: psql insertion through mapper
  }

  @GetMapping("/getPlayers")
  public Result<List<PlayerData>> getPlayersInRoom(@RequestParam String roomId) {
    try {
      return Result.success(gameService.getPlayersInRoom(roomId));
    } catch (Throwable e) {
      return Result.error(500, "failed to get player data");
    }
  }

  @PostMapping("/updatePlayerData")
  public Result<String> updatePlayerData(@RequestBody PlayerData data) {
    try {
      gameService.updatePlayerData(data);
      return Result.success("update success", "update success");
    } catch (Throwable e) {
      return Result.error(500, "update failed due to: " + e.getMessage());
    }
  }
}
