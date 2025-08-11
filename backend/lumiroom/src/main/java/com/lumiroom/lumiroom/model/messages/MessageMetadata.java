package com.lumiroom.lumiroom.model.messages;

import lombok.Builder;
import lombok.Getter;

// a message, but with metadata, this should be what the websocket is actually transferring
@Getter
@Builder // we must enforce all fields to be set
// @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)// no need, in
// application,properties
public class MessageMetadata {
    private final MessageScope scope;
    private final MessageType type;
    private final Object data;

    public static final MessageMetadata DEFAULT = MessageMetadata.builder()
            .type(MessageType.MESSAGE) // or MESSAGE, if you have such a type
            .scope(MessageScope.PUBLIC)
            .data(null)
            .build();
}