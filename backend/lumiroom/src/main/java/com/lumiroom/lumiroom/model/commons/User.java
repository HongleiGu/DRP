package com.lumiroom.lumiroom.model.commons;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class User {
  private String id;
  private String username;
  private boolean onboardingComplete;
  private Integer avatarId;
  private LocalDateTime createdAt;
  private String email;
  private String passwordHash; // stored hashed password

  // for signup
  public User(String username, String email, String passwordHash, boolean onboardingComplete) {
    this.id = null;
    this.username = username;
    this.avatarId = 1; // default
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = LocalDateTime.now();
    this.onboardingComplete = onboardingComplete;
  }
}
