// this is for make sure the websocket dont send to someone else

package com.lumiroom.lumiroom.ws;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

public class UserIdHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        // Example: extract userId from query param: ws://localhost:8080/ws/messages?userId=abc-123
        String userId = Optional.ofNullable(request.getURI().getQuery())
                .flatMap(query -> Arrays.stream(query.split("&"))
                        .filter(q -> q.startsWith("userId="))
                        .map(q -> q.substring("userId=".length()))
                        .findFirst())
                .orElse(UUID.randomUUID().toString());

        return () -> userId;
    }
}
