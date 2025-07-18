package com.lumiroom.lumiroom.service.implementation;

import com.alibaba.fastjson2.JSON;
import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.service.MessageService;
import com.lumiroom.lumiroom.service.RedisService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService{

    private final RedisService redisService;

    private static final String CHAT_PREFIX = "chat:";

    /**
     * Adds a new message to the Redis sorted set.
     * 
     * @param messageData the message to add
     * @return the message with generated ID and timestamp
     */
    public Message addMessage(Message messageData) {
        // only if the data and the chatroomId, charMessage, id are valid
        if (messageData == null || messageData.getChatRoomId() == null || messageData.getChatMessage() == null) {
            throw new IllegalArgumentException("Invalid message data");
        }

        String id = UUID.randomUUID().toString();
        LocalDateTime createdAt = LocalDateTime.now();

        messageData.setId(id);
        messageData.setCreatedAt(createdAt);

        String key = CHAT_PREFIX + messageData.getChatRoomId();
        double score = createdAt.toEpochSecond(ZoneOffset.UTC);  // specify zone offset for conversion

        try {
            String json = JSON.toJSONString(messageData);
            redisService.addToSortedSet(key, json, score);
            return messageData;
        } catch (Exception e) {
            throw e;
            // throw new RuntimeException("Failed to serialize message", e);
        }
    }

    /**
     * Retrieves all messages for a given chat room in ascending order.
     * 
     * @param chatRoomId the chat room ID
     * @return list of messages
     */
    public List<Message> getMessages(String chatRoomId) {
        if (chatRoomId == null) {
            throw new IllegalArgumentException("Invalid chat room ID");
        }

        String key = CHAT_PREFIX + chatRoomId;
        Set<String> rawMessages = redisService.getSortedSetRange(key, 0, -1);

        if (rawMessages == null || rawMessages.isEmpty()) return List.of();

        return rawMessages.stream().map(json -> {
            try {
                return JSON.parseObject(json, Message.class);
            } catch (Exception e) {
                return null;
            }
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    /**
     * Deletes a message from the sorted set by its ID.
     * 
     * @param chatRoomId the chat room ID
     * @param messageId  the message ID to delete
     * @return success message
     */
    public String deleteMessage(String chatRoomId, String messageId) {
        if (chatRoomId == null || messageId == null) {
            throw new IllegalArgumentException("Missing chat room or message ID");
        }

        String key = CHAT_PREFIX + chatRoomId;
        Set<String> rawMessages = redisService.getSortedSetRange(key, 0, -1);

        if (rawMessages == null) throw new RuntimeException("No messages found");

        Optional<String> messageToDelete = rawMessages.stream().filter(raw -> {
            try {
                Message msg = JSON.parseObject(raw, Message.class);
                return messageId.equals(msg.getId());
            } catch (Exception e) {
                return false;
            }
        }).findFirst();

        if (messageToDelete.isEmpty()) {
            throw new RuntimeException("Message not found");
        }

        redisService.removeFromSortedSet(key, messageToDelete.get());

        // No publish, since frontend Supabase broadcast handles that

        return "Message deleted";
    }

    /**
     * Creates a chat room with a placeholder message.
     * 
     * @param chatRoomId the chat room ID
     * @return success message
     */
    public String createRoom(String chatRoomId) {
        if (chatRoomId == null) {
            throw new IllegalArgumentException("Chat room ID is required");
        }

        String key = CHAT_PREFIX + chatRoomId;

        Message placeholder = Message.systemMessage(
          UUID.randomUUID().toString(), 
          chatRoomId, 
          key
        );

        try {
            String json = JSON.toJSONString(placeholder);
            double score = placeholder.getCreatedAt().toEpochSecond(ZoneOffset.UTC);
            redisService.addToSortedSet(key, json, score);
            return "Chat room created";
        } catch (Exception e) {
            throw new RuntimeException("Failed to create chat room", e);
        }
    }
}
