package com.lumiroom.lumiroom.model.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SignupRequest {
  private final String username;
  private final String email;
  private final String password;
}
