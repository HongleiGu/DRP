package com.lumiroom.lumiroom.model;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@ToString
public class Message {
  private final String id;             // Optional: Unique message ID
  private final String speaker;      // ID of the speaker
  private final String speakerName;  // Name of the speaker
  private final String chatMessage;  // The actual chat message
  private final LocalDateTime createdAt;   // Timestamp when the message was created
  private final String chatRoomId;   // Unique ID for the chatroom
  private final String videoUrl;     // Optional: URL of video
  private final Double videoTime;    // Optional: Timestamp of video time

  public static Message system(String chatMessage, String chatRoomId) {
    String randomId = UUID.randomUUID().toString();
    LocalDateTime timeStr = LocalDateTime.now();
    return Message.builder()
      .id(randomId)
      .chatMessage(chatMessage)
      .chatRoomId(chatRoomId)
      .createdAt(timeStr)
      .speaker("system")
      .speakerName("system")
      .build();
  }
}
