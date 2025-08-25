package com.lumiroom.service.rabbitmq.implementation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiroom.model.messages.Message;
import com.lumiroom.model.messages.MessageScope;
import com.lumiroom.service.messages.RedisService;
import com.lumiroom.service.rabbitmq.Receiver;
import com.lumiroom.ws.WebSocketAckTracker;
import com.lumiroom.ws.WebSocketDispatcher;
import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Component
public class ReceiverImplementation implements Receiver {

    @Autowired
    ObjectMapper mapper;

    @Autowired
    RedisService redisService;

    private static final Duration ACK_TIMEOUT = Duration.ofSeconds(5);

    private final WebSocketDispatcher dispatcher;
    private final WebSocketAckTracker ackTracker;

    public ReceiverImplementation(WebSocketDispatcher dispatcher, WebSocketAckTracker ackTracker) {
        this.dispatcher = dispatcher;
        this.ackTracker = ackTracker;
    }

    @RabbitListener(queues = "#{userQueue.name}", ackMode = "MANUAL")
    public void receive(
            String msg,
            @Header("amqp_receivedRoutingKey") String routingKey,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
            Channel channel) {
        try {
            Message message = mapper.readValue(msg, Message.class);
            String[] parts = routingKey.split("\\.");
            if (parts.length < 2)
                throw new IllegalArgumentException("Invalid routing key: " + routingKey);

            String roomId = parts[0];
            String userId = parts[1];

            System.out.println("📬 [Message to USER " + userId + " in ROOM " + roomId + "] " +
                    message.getChatMessage() + " from " + message.getSpeakerName());

            dispatcher.sendMessageToUser(userId, message);

            // Await WebSocket frontend ACK
            String ackKey = "message:" + userId + ":" + message.getId();
            CompletableFuture<Boolean> future = ackTracker.waitForAck(ackKey, ACK_TIMEOUT);

            future.whenComplete((success, error) -> {
                try {
                    if (Boolean.TRUE.equals(success)) {
                        channel.basicAck(deliveryTag, false);
                    } else {
                        System.err.println("❌ No ACK from user " + userId + " for message " + message.getId());
                        channel.basicNack(deliveryTag, false, false);

                        if (message.getMetadata().getScope() == MessageScope.PERSONAL) {
                            redisService.addMessage(userId, "personal", mapper.writeValueAsString(message));
                        } else {
                            redisService.addMessage(userId, roomId, mapper.writeValueAsString(message));
                        }
                    }
                } catch (Throwable ex) {
                    ex.printStackTrace();
                }
            });

        } catch (Throwable e) {
            e.printStackTrace();
            try {
                channel.basicNack(deliveryTag, false, false);
            } catch (Exception nackEx) {
                nackEx.printStackTrace();
            }
        }
    }
}
