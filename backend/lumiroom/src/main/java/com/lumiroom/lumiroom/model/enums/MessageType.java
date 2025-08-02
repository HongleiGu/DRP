package com.lumiroom.lumiroom.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents whether a message is public (room-based) or personal (direct to user).
 */
public enum MessageType {
    INVITE("invite"),
    MESSAGE("message"),
    GREETING("greeting");

    private final String value;

    MessageType(String value) {
        this.value = value;
    }

    @JsonValue
    public String toValue() {
        return value;
    }

    @JsonCreator
    public static MessageType fromValue(String value) {
        for (MessageType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown Messagetype: " + value);
    }
}
