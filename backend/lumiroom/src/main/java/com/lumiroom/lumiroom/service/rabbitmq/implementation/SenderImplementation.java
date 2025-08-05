package com.lumiroom.lumiroom.service.rabbitmq.implementation;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.service.rabbitmq.Sender;

/**
 * Sends messages to the topic exchange using keys like roomId.userId.suffix.
 */
@Profile("sender")
public class SenderImplementation implements Sender {

    @Autowired
    ObjectMapper mapper;

    private final RabbitTemplate rabbitTemplate;
    private final TopicExchange exchange;

    public SenderImplementation(RabbitTemplate amqpTemplate, TopicExchange exchange) {
        this.rabbitTemplate = amqpTemplate;
        this.exchange = exchange;
    }

    public void send(String routingKey, Message message) {
      String jsonMessage;
      try {
        jsonMessage = mapper.writeValueAsString(message);
      } catch (JsonProcessingException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
        return;
      }
      rabbitTemplate.convertAndSend(exchange.getName(), routingKey, jsonMessage);
      System.out.println("📤 Sent: '" + message + "' to '" + routingKey + "'");
    }
}
