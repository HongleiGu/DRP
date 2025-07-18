package com.lumiroom.lumiroom.service.implementation;

import com.lumiroom.lumiroom.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
public class RedisServiceImpl implements RedisService {

  private final StringRedisTemplate redisTemplate;

  @Autowired
  public RedisServiceImpl(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * Adds a value to Redis only if the key does not already exist.
   * 
   * @param key   the Redis key
   * @param value the value to add
   */
  @Override
  public void add(String key, String value) {
    // Add only if key doesn't already exist
    redisTemplate.opsForValue().setIfAbsent(key, value);
  }

  /**
   * Deletes a key from Redis.
   * 
   * @param key the Redis key to delete
   */
  @Override
  public void delete(String key) {
    redisTemplate.delete(key);
  }


  /**
   * Retrieves a value from Redis by key.
   * 
   * @param key the Redis key
   * @return the value associated with the key, or null if not found
   */
  @Override
  public String get(String key) {
    return redisTemplate.opsForValue().get(key);
  }


  /**
   * Sets a value in Redis for a given key without expiration.
   * 
   * @param key   the Redis key
   * @param value the value to set 
   */
  @Override
  public void set(String key, String value) {
    redisTemplate.opsForValue().set(key, value);
  }

  // Optional: overloaded set with expiration
  /**
   * Sets a value in Redis for a given key with an expiration time.
   * 
   * @param key   the Redis key
   * @param value the value to set
   * @param ttl   the time-to-live duration for the key
   */
  public void set(String key, String value, Duration ttl) {
    redisTemplate.opsForValue().set(key, value, ttl);
  }

  // sorted set operations

  /**
   * Adds a value to a sorted set with an associated score.
   *
   * @param key   the Redis key for the sorted set
   * @param value the value to add
   * @param score the score used to order the value
   */
  @Override
  public void addToSortedSet(String key, String value, double score) {
    redisTemplate.opsForZSet().add(key, value, score);
  }


  /**
   * Removes a value from a sorted set.
   *
   * @param key   the Redis key for the sorted set
   * @param value the value to remove
   */
  @Override
  public void removeFromSortedSet(String key, String value) {
    redisTemplate.opsForZSet().remove(key, value);
  }

  /**
   * Retrieves a range of values from the sorted set in ascending order by score.
   *
   * @param key   the Redis key for the sorted set
   * @param start the start index (0-based)
   * @param end   the end index (inclusive)
   * @return a set of values within the given range
   */
  @Override
  public Set<String> getSortedSetRange(String key, long start, long end) {
    return redisTemplate.opsForZSet().range(key, start, end);
  }

  /**
   * Retrieves a range of values from the sorted set in descending order by score.
   *
   * @param key   the Redis key for the sorted set
   * @param start the start index (0-based)
   * @param end   the end index (inclusive)
   * @return a set of values within the given range
   */
  @Override
  public Set<String> getSortedSetRevRange(String key, long start, long end) {
    return redisTemplate.opsForZSet().reverseRange(key, start, end);
  }
}
