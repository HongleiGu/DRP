package com.lumiroom.lumiroom.model.game;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlayerData {
    private String userId;
    private String name;
    private String roomId;
    private Integer x;
    private Integer y;
    private String direction;
    private Integer avatarId;
}
