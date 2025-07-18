package com.lumiroom.lumiroom.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a chat message in a chat room.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    private String id;              // Unique message ID
    private String speaker;         // ID of the speaker
    private String speakerName;     // Name of the speaker
    private String chatMessage;     // The actual chat message
    private LocalDateTime createdAt;// Timestamp when the message was created
    private String chatRoomId;      // Unique ID for the chatroom
    private String videoUrl;        // URL of video (optional)
    private Double videoTime;       // Video time position (optional)

    /**
     * Factory method for creating a message without video info.
     */
    public static Message noVideo(String id, String speaker, String chatMessage, LocalDateTime createdAt, String chatRoomId) {
        return Message.builder()
            .id(id)
            .speaker(speaker)
            .chatMessage(chatMessage)
            .createdAt(createdAt)
            .chatRoomId(chatRoomId)
            .build();
    }

    /**
     * Factory method for creating a system message.
     */
    public static Message systemMessage(String id, String chatRoomId, String chatMessage) {
        return Message.builder()
            .id(id)
            .chatRoomId(chatRoomId)
            .chatMessage(chatMessage)
            .createdAt(LocalDateTime.now())
            .speaker("system")
            .speakerName("System")
            .build();
    }
}
