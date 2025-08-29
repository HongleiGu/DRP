package com.lumiroom.model.messages;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lumiroom.model.GenericEnum;

/**
 * Represents whether a message is public (room-based) or personal (direct to
 * user).
 */
public enum MessageType implements GenericEnum {
    INVITE("invite"),
    MESSAGE("message"),
    GREETING("greeting"),
    ACCEPT_GREETING("accept greeting"),
    DELETE_CONTACT("delete contact");

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
