package com.echospace.service.auth;

import com.echospace.model.auth.UserOtp;
import com.echospace.model.commons.User;

public interface AuthService {
  User authenticate(String identifier, String password);

  User signup(String username, String email, String password);

  User signupFromOtp(UserOtp otp);

  User findUserByUsernameOrEmail(String identifier);

  User findUserById(String id);

  // this will combine the details in the frontend, we get a complete User object
  // to be updated
  User updateUserProfile(User updated);
}