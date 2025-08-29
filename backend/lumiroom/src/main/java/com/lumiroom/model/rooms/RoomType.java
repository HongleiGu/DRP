package com.lumiroom.model.rooms;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lumiroom.model.GenericEnum;

public enum RoomType implements GenericEnum {
  PERSONAL("personal"),
  PUBLIC("public");

  private final String value;

  RoomType(String value) {
    this.value = value;
  }

  @JsonValue
  public String toValue() {
    return value;
  }

  @JsonCreator
  public static RoomType fromValue(String value) {
    for (RoomType scope : values()) {
      if (scope.value.equalsIgnoreCase(value)) {
        return scope;
      }
    }
    throw new IllegalArgumentException("Unknown RoomType: " + value);
  }
}
