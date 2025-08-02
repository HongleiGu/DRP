package com.lumiroom.lumiroom.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiroom.lumiroom.model.Message;

import java.time.Duration;
import java.util.List;
import java.util.ArrayList;

@Service
public class RedisService {

    @Autowired
    ObjectMapper mapper;

    private final StringRedisTemplate redisTemplate;

    public RedisService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private String getRedisKey(String userId, String roomId) {
        return "message:" + userId + ":" + roomId;
    }

    public List<Message> getMessages(String userId) {
        String pattern = "message:" + userId + ":*";
        ScanOptions scanOpts = ScanOptions.scanOptions()
            .match(pattern)
            .count(1000)
            .build();

        List<Message> messages = new ArrayList<>();
        Cursor<String> cursor = null;

        try {
            cursor = redisTemplate.scan(scanOpts);
            while (cursor.hasNext()) {
                String key = cursor.next();
                List<String> raw = redisTemplate.opsForList().range(key, 0, -1);
                if (raw != null) {
                    for (String line : raw) {
                        try {
                            messages.add(mapper.readValue(line, Message.class));
                        } catch (JsonProcessingException e) {
                            // handling invalid JSON
                        }
                    }
                }
            }
        } finally {
            if (cursor != null) cursor.close();
        }

        return messages;
    }

    // Add a message to the Redis list
    public void addMessage(String userId, String roomId, String messageJson) {
        String key = getRedisKey(userId, roomId);
        redisTemplate.opsForList().rightPush(key, messageJson);
        // Optional: Set expiration
        redisTemplate.expire(key, Duration.ofDays(7));
    }

    // Get all messages for user in a room
    public List<Message> getMessages(String userId, String roomId) {
        String key = getRedisKey(userId, roomId);
        List<String> rawMessages = redisTemplate.opsForList().range(key, 0, -1);

        List<Message> messages = new ArrayList<>();
        if (rawMessages == null) return messages;

        for (String str : rawMessages) {
            try {
                messages.add(mapper.readValue(str, Message.class));
            } catch (JsonProcessingException e) {
                // You may choose to log or handle this differently
                e.printStackTrace();
            }
        }

        return messages;
    }

    // Delete all messages for user in a room
    public void deleteMessages(String userId, String roomId) {
        String key = getRedisKey(userId, roomId);
        redisTemplate.delete(key);
    }

    // Delete all messages for user
    public void deleteMessages(String userId) {
        String pattern = "message:" + userId + ":*";
        ScanOptions scanOpts = ScanOptions.scanOptions()
            .match(pattern)
            .count(1000)
            .build();

        Cursor<String> cursor = null;

        try {
            cursor = redisTemplate.scan(scanOpts);
            while (cursor.hasNext()) {
                String key = cursor.next();
                redisTemplate.delete(key);
            }
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    // Pop a single message (optional method)
    public Message popMessage(String userId, String roomId) {
        String key = getRedisKey(userId, roomId);
        try {
            return mapper.readValue(redisTemplate.opsForList().leftPop(key), Message.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return null;
        }
    }
}