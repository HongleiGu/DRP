package com.lumiroom.ws;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.lumiroom.model.game.PlayerData;
import com.lumiroom.model.messages.Message;

@Component
public class WebSocketDispatcher {

  private final SimpMessagingTemplate messagingTemplate;

  public WebSocketDispatcher(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void sendMessageToUser(String userId, Message message) {
    String destination = "/queue/messages";
    System.out.println("Sending to" + destination);
    messagingTemplate.convertAndSendToUser(
        userId,
        destination, // client will subscribe to this
        message);
  }

  public void sendPlayerDataToRoom(String roomId, PlayerData message) {
    String destination = "/queue/messages";// + message.getRoomId();
    System.out.println("Sending to" + destination);
    messagingTemplate.convertAndSend(
        destination,
        message);
  }
}
