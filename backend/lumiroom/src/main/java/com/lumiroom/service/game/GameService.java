package com.lumiroom.service.game;

import java.util.List;

import com.lumiroom.model.commons.User;
import com.lumiroom.model.game.PlayerData;

public interface GameService {
  List<PlayerData> getPlayersInRoom(String roomId);

  void updatePlayerData(PlayerData data);

  void updatePlayerData(User userId, String roomId, Integer x, Integer y);
}
