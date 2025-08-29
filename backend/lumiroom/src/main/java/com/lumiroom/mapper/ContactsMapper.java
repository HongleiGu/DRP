package com.lumiroom.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.lumiroom.model.contacts.Contacts;

@Mapper
public interface ContactsMapper {
  void insertContacts(String firstUser, String secondUser, String roomId);

  Contacts getContacts(String firstUser, String secondUser);
}
