package com.lumiroom.lumiroom.service.auth;

import com.lumiroom.lumiroom.model.User;

public interface AuthService {
  public User authenticate(String identifier, String password);
  public User signup(String username, String email, String password);
}