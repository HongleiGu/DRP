package com.lumiroom.model.contacts;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Contacts {
  private String id;
  private String firstUser;
  private String secondUser;
  private String roomId;

  public Contacts(String firstUser, String secondUser, String roomId) {
    this.firstUser = firstUser;
    this.secondUser = secondUser;
    this.roomId = roomId;
  }

  public Contacts(String firstUser, String secondUser) {
    this.firstUser = firstUser;
    this.secondUser = secondUser;
  }
}
