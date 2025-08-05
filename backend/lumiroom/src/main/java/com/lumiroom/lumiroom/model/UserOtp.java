package com.lumiroom.lumiroom.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserOtp {
    private String id;
    private String email;
    private String otp;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    // getters and setters
    public UserOtp(String otp, String email) {
      this.id = null;
      this.email = email;
      this.otp = otp;
      this.createdAt = LocalDateTime.now();
      this.expiresAt = LocalDateTime.now().plusHours(1);
    }
}
