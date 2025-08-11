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
        config.enableSimpleBroker("/queue", "/topic"); // For per-user messages / broadcasts
        config.setApplicationDestinationPrefixes("/app"); // For @MessageMapping
        config.setUserDestinationPrefix("/user"); // Used by convertAndSendToUser
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/messages") // Client connects here
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new UserIdHandshakeHandler())
                .withSockJS(); // Enables SockJS fallback
        registry.addEndpoint("/ws/game") // Client connects here
                .setAllowedOriginPatterns("*")
                // .setHandshakeHandler(new UserIdHandshakeHandler()) // we will handle the
                // previleges in the controller, no handshake needed
                .withSockJS(); // Enables SockJS fallback
    }
}
