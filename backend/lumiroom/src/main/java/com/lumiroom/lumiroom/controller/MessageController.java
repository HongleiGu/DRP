package com.lumiroom.lumiroom.controller;


import org.springframework.web.bind.annotation.RequestMapping;
// 请求处理类
import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.lumiroom.model.Message;
import com.lumiroom.lumiroom.service.MessageService;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/api/message")
public class MessageController {

  @Autowired
  private MessageService messageService;
  
  @PostMapping("/addMessage")
  public ResponseEntity<String> addMessage(@RequestBody Message message) {
    try {
      messageService.addMessage(message);
      return ResponseEntity.ok("Message added successfully");
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).body("Error adding message: " + e.getMessage());
    }
  }
  
  @GetMapping("/getMessage")
  public ResponseEntity<List<Message>> getMessages(@RequestParam String chatRoomId) {
    try {
      return ResponseEntity.ok(messageService.getMessages(chatRoomId));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).body(null);
    }
  }

  @DeleteMapping("/deleteMessage")
  public ResponseEntity<String> deleteMessage(@RequestParam String chatRoomId, @RequestParam String messageId) {
    try {
      return ResponseEntity.ok(messageService.deleteMessage(chatRoomId, messageId));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).body("Error deleting message: " + e.getMessage());
    }
  }
}
