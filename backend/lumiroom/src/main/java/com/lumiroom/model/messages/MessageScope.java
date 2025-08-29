package com.lumiroom.model.messages;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lumiroom.model.GenericEnum;

/**
 * Represents whether a message is public (room-based) or personal (direct to
 * user).
 */
public enum MessageScope implements GenericEnum {
    PERSONAL("personal"),
    PUBLIC("public");

    private final String value;

    MessageScope(String value) {
        this.value = value;
    }

    @JsonValue
    public String toValue() {
        return value;
    }

    @JsonCreator
    public static MessageScope fromValue(String value) {
        for (MessageScope scope : values()) {
            if (scope.value.equalsIgnoreCase(value)) {
                return scope;
            }
        }
        throw new IllegalArgumentException("Unknown MessageScope: " + value);
    }
}
