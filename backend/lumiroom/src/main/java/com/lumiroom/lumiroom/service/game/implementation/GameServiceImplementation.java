package com.lumiroom.lumiroom.service.game.implementation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lumiroom.lumiroom.mapper.GameMapper;
import com.lumiroom.lumiroom.mapper.RoomMapper;
import com.lumiroom.lumiroom.mapper.UserMapper;
import com.lumiroom.lumiroom.model.commons.User;
import com.lumiroom.lumiroom.model.game.PlayerData;
import com.lumiroom.lumiroom.service.game.GameService;

@Service
public class GameServiceImplementation implements GameService {

  @Autowired
  private GameMapper mapper;

  public List<PlayerData> getPlayersInRoom(String roomId) {
    return mapper.getPlayersInRoom(roomId);
  }

  public void updatePlayerData(PlayerData data) {
    mapper.updatePlayerData(data);
  }

  public void updatePlayerData(User user, String roomId, Integer x, Integer y) {
    mapper.updatePlayerData(new PlayerData(user.getId(), user.getUsername(), roomId, x, y, "down", user.getAvatarId()));
  }
}
