package com.lumiroom.lumiroom.service.game;

import java.util.List;

import com.lumiroom.lumiroom.model.commons.User;
import com.lumiroom.lumiroom.model.game.PlayerData;

public interface GameService {
  List<PlayerData> getPlayersInRoom(String roomId);

  void updatePlayerData(PlayerData data);

  void updatePlayerData(User userId, String roomId, Integer x, Integer y);
}
