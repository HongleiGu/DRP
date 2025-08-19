package com.echospace.ws;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.echospace.model.game.PlayerData;
import com.echospace.model.messages.Message;

@Component
public class WebSocketDispatcher {

  private final SimpMessagingTemplate messagingTemplate;

  public WebSocketDispatcher(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void sendMessageToUser(String userId, Message message) {
    messagingTemplate.convertAndSendToUser(
        "msg-" + userId,
        "/queue/messages", // client will subscribe to this
        message);
  }

  public void sendPlayerDataToRoom(String roomId, PlayerData message) {
    String destination = "/topic/game/" + message.getRoomId();
    messagingTemplate.convertAndSend(
        destination,
        message);
  }
}
