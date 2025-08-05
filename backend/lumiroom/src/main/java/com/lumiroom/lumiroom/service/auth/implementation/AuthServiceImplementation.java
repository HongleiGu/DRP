package com.lumiroom.lumiroom.service.auth.implementation;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lumiroom.lumiroom.mapper.UserMapper;
import com.lumiroom.lumiroom.model.User;
import com.lumiroom.lumiroom.service.auth.AuthService;

@Service
public class AuthServiceImplementation implements AuthService {

  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;

  public AuthServiceImplementation(UserMapper userMapper, PasswordEncoder passwordEncoder) {
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
  }

  public User authenticate(String identifier, String password) {
    User user = userMapper.findByUsernameOrEmail(identifier);
    if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
      return user;
    }
    return null;
  }

  public User signup(String username, String email, String password) {
    User user = new User(username, email, passwordEncoder.encode(password), true);
    return this.userMapper.insertUser(user);
  }
}
