package com.echospace.service.messages;

import java.util.List;

import com.echospace.model.messages.Message;

public interface RedisService {
  public List<Message> getMessages(String userId);

  public void addMessage(String userId, String roomId, String messageJson);

  public List<Message> getMessages(String userId, String roomId);

  public void deleteMessages(String userId, String roomId);

  public void deleteMessages(String userId);
}
