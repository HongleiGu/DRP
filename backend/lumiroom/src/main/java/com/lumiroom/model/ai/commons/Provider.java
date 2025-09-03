package com.lumiroom.model.ai.commons;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lumiroom.model.GenericEnum;

public enum Provider implements GenericEnum {
  OLLAMA("ollama"),
  OPENAI("openai");

  private final String value;

  Provider(String value) {
    this.value = value;
  }

  @JsonValue
  public String toValue() {
    return value;
  }

  @JsonCreator
  public static Provider fromValue(String value) {
    for (Provider type : values()) {
      if (type.value.equalsIgnoreCase(value)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unknown Provider: " + value);
  }
}
