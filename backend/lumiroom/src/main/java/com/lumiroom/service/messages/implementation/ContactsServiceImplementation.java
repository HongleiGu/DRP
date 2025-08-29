package com.lumiroom.service.messages.implementation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lumiroom.mapper.ContactsMapper;
import com.lumiroom.model.contacts.Contacts;
// import com.lumiroom.model.contacts.ContactStatus;
import com.lumiroom.service.messages.ContactsService;

@Service
public class ContactsServiceImplementation implements ContactsService {

  @Autowired
  private ContactsMapper contactsMapper;

  public void addContacts(String firstUser, String secondUser, String roomId) {
    contactsMapper.insertContacts(firstUser, secondUser, roomId);
  }

  public Contacts getContacts(String firstUser, String secondUser) {
    return contactsMapper.getContacts(firstUser, secondUser);
  }

  // @Override
  // public void changeContactStatus(String firstUser, String secondUser,
  // ContactStatus status) {
  // contactsMapper.changeContactStatus(firstUser, secondUser, status);
  // }

}