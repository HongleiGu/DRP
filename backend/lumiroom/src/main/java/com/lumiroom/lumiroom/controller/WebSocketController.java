package com.lumiroom.lumiroom.controller;

import java.security.Principal;

import org.springframework.context.annotation.Profile;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.lumiroom.lumiroom.model.ws.AckPayload;
import com.lumiroom.lumiroom.ws.WebSocketAckTracker;

@Profile("websocket")
@Controller
public class WebSocketController {

    private final WebSocketAckTracker ackTracker;

    public WebSocketController(WebSocketAckTracker ackTracker) {
        this.ackTracker = ackTracker;
    }

    @MessageMapping("/message/ack") // Client sends to /app/message/ack
    public void receiveAck(AckPayload payload, Principal principal) {
        String userId = principal.getName();
        ackTracker.confirmAck("message:" + userId + ":" + payload.getMessageId(), payload.isSuccess());
    }
    // no game acking is needed
}
