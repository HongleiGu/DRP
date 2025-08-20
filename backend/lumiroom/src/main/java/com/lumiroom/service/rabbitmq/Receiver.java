package com.lumiroom.service.rabbitmq;

import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;

import com.rabbitmq.client.Channel;

public interface Receiver {
  /**
   * receive a message add message verification settings
   * 
   * @param msg
   * @param routingKey
   * @param deliveryTag
   * @param channel
   */
  public void receive(
      String msg,
      @Header("amqp_receivedRoutingKey") String routingKey,
      @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
      Channel channel);
}
