package com.lumiroom.lumiroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.lumiroom.lumiroom.ws.UserIdHandshakeHandler;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue"); // For per-user messages
        config.setApplicationDestinationPrefixes("/app"); // For @MessageMapping
        config.setUserDestinationPrefix("/user"); // Used by convertAndSendToUser
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // Client connects here
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new UserIdHandshakeHandler())
                .withSockJS(); // Enables SockJS fallback
    }
}
