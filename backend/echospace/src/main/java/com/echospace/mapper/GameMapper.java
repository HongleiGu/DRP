package com.echospace.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.echospace.model.game.PlayerData;

@Mapper
public interface GameMapper {
  List<PlayerData> getPlayersInRoom(String roomId);

  void updatePlayerData(PlayerData data);
}
