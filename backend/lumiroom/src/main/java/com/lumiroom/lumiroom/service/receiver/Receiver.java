package com.lumiroom.lumiroom.service.receiver;

import com.alibaba.fastjson2.JSON;
import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.ws.WebSocketAckTracker;
import com.lumiroom.lumiroom.ws.WebSocketDispatcher;
import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Component
@Profile("receiver")
public class Receiver {

    private static final Duration ACK_TIMEOUT = Duration.ofSeconds(5);

    private final WebSocketDispatcher dispatcher;
    private final WebSocketAckTracker ackTracker;

    public Receiver(WebSocketDispatcher dispatcher, WebSocketAckTracker ackTracker) {
        this.dispatcher = dispatcher;
        this.ackTracker = ackTracker;
    }

    @RabbitListener(queues = "#{userQueue.name}", ackMode = "MANUAL")
    public void receive(
        String msg,
        @Header("amqp_receivedRoutingKey") String routingKey,
        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
        Channel channel
    ) {
        try {
            Message message = JSON.parseObject(msg, Message.class);
            String[] parts = routingKey.split("\\.");
            if (parts.length < 2) throw new IllegalArgumentException("Invalid routing key: " + routingKey);

            String roomId = parts[0];
            String userId = parts[1];

            System.out.println("📬 [Message to USER " + userId + " in ROOM " + roomId + "] " +
                    message.getChatMessage() + " from " + message.getSpeakerName());

            dispatcher.sendToUser(userId, message);

            // Await WebSocket frontend ACK
            String ackKey = userId + ":" + message.getId();
            CompletableFuture<Boolean> future = ackTracker.waitForAck(ackKey, ACK_TIMEOUT);

            future.whenComplete((success, error) -> {
                try {
                    if (Boolean.TRUE.equals(success)) {
                        channel.basicAck(deliveryTag, false);
                    } else {
                        System.err.println("❌ No ACK from user " + userId + " for message " + message.getId());
                        channel.basicNack(deliveryTag, false, false);

                        // TODO: Push unacknowledged message to Redis
                        // Example:
                        // redisTemplate.opsForList().leftPush("nack:messages", message);
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
            try {
                channel.basicNack(deliveryTag, false, false);

                // TODO: Push failed-to-parse or fatal error message to Redis
                // Optional: capture the raw `msg` or details for diagnosis
            } catch (Exception nackEx) {
                nackEx.printStackTrace();
            }
        }
    }
}
