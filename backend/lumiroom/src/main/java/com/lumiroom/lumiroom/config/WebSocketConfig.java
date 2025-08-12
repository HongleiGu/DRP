package com.lumiroom.lumiroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.lumiroom.lumiroom.ws.UserIdHandshakeHandler;

/**
 * WebSocket configuration for Lumiroom's STOMP-based messaging system.
 * <p>
 * This configuration enables both user-specific and broadcast messaging
 * channels.
 * It defines WebSocket endpoints for:
 * </p>
 * <ul>
 * <li>Chat and messaging: <code>/ws/messages</code></li>
 * <li>Game updates: <code>/ws/game</code></li>
 * </ul>
 *
 * <h3>Message Broker Settings</h3>
 * <ul>
 * <li><strong>Simple Broker</strong>:
 * <ul>
 * <li><code>/queue</code> — private, point-to-point messages (per-user
 * queues).</li>
 * <li><code>/topic</code> — broadcast messages to all subscribers.</li>
 * </ul>
 * </li>
 * <li><strong>Application Destination Prefix</strong>: <code>/app</code>
 * — incoming client messages targeting {@code @MessageMapping} methods must
 * start with this prefix.</li>
 * <li><strong>User Destination Prefix</strong>: <code>/user</code>
 * — used internally for routing {@code convertAndSendToUser} calls to specific
 * connected users.</li>
 * </ul>
 *
 * <h3>Endpoints</h3>
 * <ul>
 * <li><code>/ws/messages</code> — uses {@link UserIdHandshakeHandler} to
 * associate
 * WebSocket sessions with a backend user ID during the handshake process.
 * This allows reliable per-user message delivery and acknowledgment tracking.
 * SockJS fallback is enabled.</li>
 * <li><code>/ws/game</code> — intended for multiplayer game events.
 * No custom handshake handler is used here; authentication/authorization
 * is delegated to the corresponding controllers.
 * SockJS fallback is enabled.</li>
 * </ul>
 *
 * <h3>CORS Policy</h3>
 * <ul>
 * <li>All origins are allowed (<code>*</code>) for WebSocket connections.</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures message broker channels and destination prefixes.
     *
     * @param config the broker registry to configure
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple broker handles subscription endpoints for queues and topics
        config.enableSimpleBroker("/queue", "/topic");
        // All messages sent to @MessageMapping endpoints must start with /app
        config.setApplicationDestinationPrefixes("/app");
        // Enables per-user routing for convertAndSendToUser
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Registers WebSocket/STOMP endpoints for clients to connect to.
     *
     * @param registry the endpoint registry to configure
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/messages")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new UserIdHandshakeHandler())
                .withSockJS();

        registry.addEndpoint("/ws/game")
                .setAllowedOriginPatterns("*")
                // Authorization is handled at the controller level, so no handshake handler is
                // set
                .withSockJS();
    }
}
