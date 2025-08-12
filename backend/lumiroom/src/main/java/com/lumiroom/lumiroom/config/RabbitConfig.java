package com.lumiroom.lumiroom.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.lumiroom.lumiroom.service.rabbitmq.Receiver;
import com.lumiroom.lumiroom.service.rabbitmq.Sender;
import com.lumiroom.lumiroom.service.rabbitmq.implementation.ReceiverImplementation;
import com.lumiroom.lumiroom.service.rabbitmq.implementation.SenderImplementation;
import com.lumiroom.lumiroom.ws.WebSocketAckTracker;
import com.lumiroom.lumiroom.ws.WebSocketDispatcher;

/**
 * RabbitMQ configuration for the Lumiroom messaging system.
 * <p>
 * This configuration defines:
 * <ul>
 * <li>A topic exchange for message routing.</li>
 * <li>A sender bean (only in {@code sender} profile) to publish messages.</li>
 * <li>A receiver bean (only in {@code receiver} profile) to consume
 * messages.</li>
 * <li>Dynamic anonymous queues for receivers to bind to the exchange.</li>
 * </ul>
 * </p>
 *
 * <p>
 * The application uses a {@code sender} / {@code receiver} profile separation:
 * <ul>
 * <li>{@code sender} profile: Configures only the message publishing
 * components.</li>
 * <li>{@code receiver} profile: Configures the consumer queue, bindings, and
 * message processing components.</li>
 * </ul>
 * </p>
 * 
 * @author Honglei Gu
 * @since 1.0
 */
@Configuration
public class RabbitConfig {

    /**
     * The name of the RabbitMQ topic exchange for chat messages.
     */
    public static final String TOPIC_EXCHANGE_NAME = "chat.topic";

    /**
     * Creates a {@link TopicExchange} for message routing.
     *
     * @return the topic exchange
     */
    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    /**
     * Creates a {@link Sender} bean for publishing messages to RabbitMQ.
     * <p>
     * Only active when the {@code sender} profile is enabled.
     * </p>
     *
     * @param rabbitTemplate the RabbitMQ template for sending messages
     * @param topicExchange  the topic exchange to publish to
     * @return the sender implementation
     */
    @Profile("sender")
    @Bean
    public Sender sender(RabbitTemplate rabbitTemplate, TopicExchange topicExchange) {
        return new SenderImplementation(rabbitTemplate, topicExchange);
    }

    /**
     * RabbitMQ receiver configuration, active only under the {@code receiver}
     * profile.
     * <p>
     * Declares:
     * <ul>
     * <li>An anonymous, auto-delete queue for message consumption.</li>
     * <li>A binding from that queue to the topic exchange.</li>
     * <li>A {@link Receiver} implementation for dispatching incoming messages via
     * WebSockets.</li>
     * </ul>
     * </p>
     */
    @Profile("receiver")
    @Configuration
    static class ReceiverConfig {

        /**
         * Declares an anonymous, auto-delete queue for the receiver instance.
         *
         * @return the anonymous queue
         */
        @Bean
        public Queue userQueue() {
            return new AnonymousQueue();
        }

        /**
         * Binds the anonymous queue to the topic exchange with a wildcard routing key.
         * <p>
         * This allows the receiver to get all messages published to the exchange.
         * </p>
         *
         * @param topicExchange the topic exchange
         * @param userQueue     the queue to bind
         * @return the queue binding
         */
        @Bean
        public Binding userBinding(TopicExchange topicExchange, Queue userQueue) {
            return BindingBuilder.bind(userQueue)
                    .to(topicExchange)
                    .with("#");
        }

        /**
         * Creates a {@link Receiver} bean that uses WebSockets to dispatch messages
         * and track acknowledgements.
         *
         * @param dispatcher the WebSocket message dispatcher
         * @param ackTracker the WebSocket acknowledgement tracker
         * @return the receiver implementation
         */
        @Bean
        public Receiver receiver(WebSocketDispatcher dispatcher, WebSocketAckTracker ackTracker) {
            return new ReceiverImplementation(dispatcher, ackTracker);
        }
    }

}
