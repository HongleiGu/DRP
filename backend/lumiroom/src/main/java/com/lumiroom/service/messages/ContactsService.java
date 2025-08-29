package com.lumiroom.service.messages;

import com.lumiroom.model.contacts.Contacts;

// import com.lumiroom.model.contacts.ContactStatus;

public interface ContactsService {
  public void addContacts(String firstUser, String secondUser, String roomId);

  public Contacts getContacts(String firstUser, String secondUser);

  // public void changeContactStatus(String firstUser, String secondUser,
  // ContactStatus status);
}
