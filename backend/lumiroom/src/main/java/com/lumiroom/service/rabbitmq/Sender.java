package com.lumiroom.service.rabbitmq;

import com.lumiroom.model.messages.Message;

/**
 * Sends messages to the topic exchange using keys like roomId.userId.suffix.
 */
public interface Sender {
  /**
   * send a message
   * 
   * @param routingKey
   * @param message
   */
  public void send(String routingKey, Message message);
}
