package com.lumiroom.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.lumiroom.model.ws.AckPayload;
import com.lumiroom.ws.WebSocketAckTracker;

/**
 * Handles WebSocket-based acknowledgment messages from clients.
 * <p>
 * This controller is only active when the Spring profile {@code websocket} is
 * enabled.
 * It listens for acknowledgment (ACK) frames from the frontend to confirm that
 * a
 * message sent over WebSocket was successfully received and processed by the
 * client.
 * <p>
 * The acknowledgment system helps ensure reliable delivery by allowing the
 * backend
 * to track which messages have been confirmed by the receiver.
 * <p>
 * Current scope:
 * <ul>
 * <li>ACK tracking is implemented <b>only for chat/messages</b></li>
 * <li>No game state or gameplay event ACKs are required</li>
 * </ul>
 *
 * <b>Workflow:</b>
 * <ol>
 * <li>Server sends a message to a specific user via STOMP/WebSocket.</li>
 * <li>The client application receives the message and, after processing,
 * sends an ACK payload back to {@code /app/message/ack}.</li>
 * <li>This controller receives the ACK, identifies the user via
 * {@link Principal},
 * and calls {@link WebSocketAckTracker#confirmAck(String, boolean)} to mark it
 * confirmed.</li>
 * </ol>
 *
 * <b>Security note:</b> The {@link Principal} comes from the authenticated
 * WebSocket session,
 * so the server can reliably associate ACKs with the correct user.
 *
 * @author Honglei Gu
 * @since 1.0
 */
@Controller
public class WebSocketController {

    private final WebSocketAckTracker ackTracker;

    /**
     * Constructs a new {@code WebSocketController}.
     *
     * @param ackTracker the service responsible for tracking and confirming message
     *                   acknowledgments
     */
    public WebSocketController(WebSocketAckTracker ackTracker) {
        this.ackTracker = ackTracker;
    }

    /**
     * Handles incoming acknowledgment (ACK) messages from clients.
     * <p>
     * Listens for STOMP messages sent to {@code /app/message/ack}.
     * The {@link AckPayload} contains the message ID being acknowledged and a flag
     * indicating whether the client successfully processed it.
     * <p>
     * The backend constructs a unique ACK key in the format:
     * {@code message:<userId>:<messageId>} and stores the confirmation
     * in the {@link WebSocketAckTracker}.
     *
     * @param payload   the acknowledgment payload containing:
     *                  <ul>
     *                  <li>{@code messageId} – ID of the message being
     *                  acknowledged</li>
     *                  <li>{@code success} – true if processing succeeded on
     *                  client</li>
     *                  </ul>
     * @param principal the authenticated WebSocket user;
     *                  {@code principal.getName()}
     *                  is used as the unique user ID
     */
    @MessageMapping("/message/ack")
    public void receiveAck(AckPayload payload, Principal principal) {
        String userId = principal.getName();
        ackTracker.confirmAck("message:" + userId + ":" + payload.getMessageId(), payload.isSuccess());
    }
    // No ACK is needed for game updates — only for chat/message delivery
    // confirmations.
}
