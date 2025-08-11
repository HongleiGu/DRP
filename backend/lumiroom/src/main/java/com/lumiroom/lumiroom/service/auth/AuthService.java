package com.lumiroom.lumiroom.service.auth;

import com.lumiroom.lumiroom.model.auth.UserOtp;
import com.lumiroom.lumiroom.model.commons.User;

public interface AuthService {
  User authenticate(String identifier, String password);

  User signup(String username, String email, String password);

  User signupFromOtp(UserOtp otp);

  User findUserByUsernameOrEmail(String identifier);

  User findUserById(String id);
}