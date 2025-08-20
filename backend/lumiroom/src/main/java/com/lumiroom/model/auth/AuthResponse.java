package com.lumiroom.model.auth;

import com.lumiroom.model.commons.User;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
  private final User user; // the use information
  private final String token; // the jwt token
}
