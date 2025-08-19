package com.echospace.service.game;

import java.util.List;

import com.echospace.model.commons.User;
import com.echospace.model.game.PlayerData;

public interface GameService {
  List<PlayerData> getPlayersInRoom(String roomId);

  void updatePlayerData(PlayerData data);

  void updatePlayerData(User userId, String roomId, Integer x, Integer y);
}
