package com.lumiroom.lumiroom.service.rabbitmq;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiroom.lumiroom.model.messages.Message;

/**
 * Sends messages to the topic exchange using keys like roomId.userId.suffix.
 */
@Profile("sender")
public interface Sender {
  /**
   * send a message
   * 
   * @param routingKey
   * @param message
   */
  public void send(String routingKey, Message message);
}
