package com.lumiroom.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.model.commons.Result;
import com.lumiroom.model.contacts.Contacts;
import com.lumiroom.model.rooms.Room;
import com.lumiroom.service.messages.ContactsService;
import com.lumiroom.service.messages.RoomService;

@RestController
@CrossOrigin
@RequestMapping("/api/contacts")
public class ContactController {

  @Autowired
  ContactsService contactsService;

  @Autowired
  RoomService roomService;

  @PostMapping("/addContacts")
  public Result<String> addContacts(@RequestBody Contacts contacts) {
    try {
      contactsService.addContacts(contacts.getFirstUser(), contacts.getSecondUser(), contacts.getRoomId());
      return Result.success("contacts added");
    } catch (Throwable e) {
      return Result.error("failed to add contacts due to error: " + e.getMessage());
    }
  }

  // contacts are treats as 1-to-1 group chats, so we return a room instead of a
  // contact
  @GetMapping("/getContacts")
  public Result<Room> getContacts(@RequestParam String firstUser, @RequestParam String secondUser) {
    try {
      Contacts contacts = contactsService.getContacts(firstUser, secondUser);
      System.out.println(contacts);
      Room room = roomService.getRoom(contacts.getRoomId());
      System.out.println(room);
      return Result.success(room);
    } catch (Throwable e) {
      return Result.error("failed to get contacts due to error: " + e.toString());
    }
  }
}