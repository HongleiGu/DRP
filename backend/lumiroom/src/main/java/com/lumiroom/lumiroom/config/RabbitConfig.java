package com.lumiroom.lumiroom.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.lumiroom.lumiroom.service.receiver.Receiver;
import com.lumiroom.lumiroom.service.sender.Sender;
import com.lumiroom.lumiroom.ws.WebSocketAckTracker;
import com.lumiroom.lumiroom.ws.WebSocketDispatcher;

@Configuration
public class RabbitConfig {

    public static final String TOPIC_EXCHANGE_NAME = "chat.topic";


    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    @Profile("sender")
    @Bean
    public Sender sender(RabbitTemplate rabbitTemplate, TopicExchange topicExchange) {
        return new Sender(rabbitTemplate, topicExchange);
    }

    @Profile("receiver")
    @Configuration
    static class ReceiverConfig {

        @Value("${lumiroom.user-id}")
        private String userId;

        @Bean
        public Queue userQueue() {
            return new AnonymousQueue();
        }

        @Bean
        public Binding userBinding(TopicExchange topicExchange, Queue userQueue) {
            return BindingBuilder.bind(userQueue)
                    .to(topicExchange)
                    .with("#");
        }

        @Bean
        public Receiver receiver(WebSocketDispatcher dispatcher, WebSocketAckTracker ackTracker) {
            return new Receiver(dispatcher, ackTracker);
        }
    }

}
