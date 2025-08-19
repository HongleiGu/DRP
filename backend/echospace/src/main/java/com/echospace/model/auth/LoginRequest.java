package com.echospace.model.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginRequest {
  private final String identifier; // email or username
  private final String password; // unhashed password
}
