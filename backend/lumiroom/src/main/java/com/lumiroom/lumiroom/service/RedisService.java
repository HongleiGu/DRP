package com.lumiroom.lumiroom.service;

import java.util.Set;

public interface RedisService {
  // we need add, delete, get, set methods for Redis operations
  void add(String key, String value);
  void delete(String key);
  String get(String key);
  void set(String key, String value);

  // ordered set operations
  void addToSortedSet(String key, String value, double score);
  void removeFromSortedSet(String key, String value);
  Set<String> getSortedSetRange(String key, long start, long end); // ascending
  Set<String> getSortedSetRevRange(String key, long start, long end); // descending
}
