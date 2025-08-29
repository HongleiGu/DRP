package com.lumiroom.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.model.commons.Result;
import com.lumiroom.model.commons.User;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.model.rooms.RoomCreationRequest;
import com.lumiroom.model.rooms.RoomRequest;
import com.lumiroom.model.rooms.RoomRequestBatched;
import com.lumiroom.model.rooms.RoomType;
import com.lumiroom.model.rooms.RoomWithMembers;
import com.lumiroom.service.auth.AuthService;
import com.lumiroom.service.game.GameService;
import com.lumiroom.service.messages.RoomService;
import com.lumiroom.utils.Utils;

@RestController
@CrossOrigin
@RequestMapping("/api/rooms")
public class RoomController {
  @Autowired
  RoomService roomService;

  @Autowired
  AuthService authService;

  @Autowired
  GameService gameService;

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
      Room room = roomService.getRoom(roomId);
      List<User> members = roomService.getRoomMembers(roomId);
      if (room == null) {
        return Result.success(false, "the room does not exist");
      } else if (members.size() == 0 && room != null) {
        return Result.success(true, "the room exists, but there are no members in it");
      } else if (members.size() != 0 && room == null) {
        throw new Exception(
            "the room do nt exist, but there are members in the room, its likely the database is corrupted, contact the admin");
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
      if (req.getType() == "personal") {
        req.setCreatorId(Utils.systemUUID());
      }
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
  public Result<String> insertUsersToRoom(@RequestBody RoomRequest req) {
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
  public Result<String> insertUsersToRoomBatched(@RequestBody RoomRequestBatched req) {
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

  @GetMapping("/getRoom")
  public Result<RoomWithMembers> getRoom(@RequestParam String roomId) {
    try {
      Room room = roomService.getRoom(roomId);
      List<User> users = roomService.getRoomMembers(roomId);
      if (room == null) {
        return Result.error(400, "the room does not exist");
      }
      return Result.success(new RoomWithMembers(room, users));
    } catch (Throwable e) {
      return Result.error(e.getMessage());
    }
  }

  @DeleteMapping("/deleteUserFromRoom")
  public Result<String> deleteUserFromRoom(@RequestBody RoomRequest req) {
    try {
      String userId = req.getUserId();
      String roomId = req.getRoomId();
      Room room = roomService.getRoom(roomId);
      if (room == null) {
        return Result.error(400, "the room does not exist");
      }
      if (room.getType() != RoomType.PERSONAL) { // personal rooms should not have restriction
        if (room.getCreatorId() != userId) {
          return Result.error(400, "you are not authorized the delete the user from the room");
        }
      }
      roomService.deleteUserFromRoom(req.getUserId(), req.getRoomId());
      return Result.success("deletion success");
    } catch (Throwable e) {
      return Result.error(e.getMessage());
    }
  }

  @DeleteMapping("/deleteRoom")
  public Result<String> deleteRoom(@RequestParam String roomId) {
    try {
      roomService.deleteRoom(roomId);
      List<User> users = roomService.getRoomMembers(roomId);
      for (User user : users) {
        roomService.deleteUserFromRoom(user.getId(), roomId);
      }
      return Result.success("deletion success");
    } catch (Throwable e) {
      return Result.error(e.getMessage());
    }
  }
}
