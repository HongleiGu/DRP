package com.lumiroom.lumiroom.model.auth;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserOtp {
  private String id;
  private String email;
  private String password;
  private String username;
  private String otp;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;

  // getters and setters
  public UserOtp(String otp, String email, String password, String username) {
    this.id = null;
    this.email = email;
    this.password = password;
    this.username = username;
    this.otp = otp;
    this.createdAt = LocalDateTime.now();
    this.expiresAt = LocalDateTime.now().plusHours(1); // default expire time an hour
  }

  public UserOtp(String otp, SignupRequest request) {
    this.id = null;
    this.email = request.getEmail();
    this.password = request.getPassword();
    this.username = request.getUsername();
    this.otp = otp;
    this.createdAt = LocalDateTime.now();
    this.expiresAt = LocalDateTime.now().plusHours(1); // default expire time an hour
  }
}
