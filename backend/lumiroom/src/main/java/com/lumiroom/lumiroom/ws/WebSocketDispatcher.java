package com.lumiroom.lumiroom.ws;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketDispatcher {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketDispatcher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendToUser(String userId, Object message) {
      messagingTemplate.convertAndSendToUser(
        userId,
        "/queue/messages", // client will subscribe to this
        message
      );
    }
}
