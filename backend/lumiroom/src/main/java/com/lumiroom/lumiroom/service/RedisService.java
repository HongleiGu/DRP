package com.lumiroom.lumiroom.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class RedisService {

  private final StringRedisTemplate redisTemplate;

  public RedisService(StringRedisTemplate redisTemplate) {
      this.redisTemplate = redisTemplate;
  }

  private String getRedisKey(String userId, String roomId) {
      return "message:" + userId + ":" + roomId;
  }

  // Add a message to the Redis list
  public void addMessage(String userId, String roomId, String messageJson) {
      String key = getRedisKey(userId, roomId);
      redisTemplate.opsForList().rightPush(key, messageJson);
      // Optional: Set expiration
      redisTemplate.expire(key, Duration.ofDays(7));
  }

  // Get all messages for user in a room
  public List<String> getMessages(String userId, String roomId) {
      String key = getRedisKey(userId, roomId);
      return redisTemplate.opsForList().range(key, 0, -1);
  }

  // Delete all messages for user in a room
  public void deleteMessages(String userId, String roomId) {
      String key = getRedisKey(userId, roomId);
      redisTemplate.delete(key);
  }

  // Pop a single message (optional method)
  public String popMessage(String userId, String roomId) {
      String key = getRedisKey(userId, roomId);
      return redisTemplate.opsForList().leftPop(key);
  }
}
