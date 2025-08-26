package com.lumiroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.lumiroom.model.game.PlayerData;

@Mapper
public interface GameMapper {
  List<PlayerData> getPlayersInRoom(String roomId);

  void updatePlayerData(PlayerData data);

  void insertPlayer(PlayerData playerData);
}
