package com.lumiroom.service.auth.implementation;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lumiroom.mapper.UserMapper;
import com.lumiroom.model.auth.UserOtp;
import com.lumiroom.model.commons.User;
import com.lumiroom.service.auth.AuthService;

@Service
public class AuthServiceImplementation implements AuthService {

  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;

  public AuthServiceImplementation(UserMapper userMapper, PasswordEncoder passwordEncoder) {
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
  }

  public User authenticate(String identifier, String password) {
    User user = userMapper.findUserByUsernameOrEmail(identifier);
    System.out.println(user);
    if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
      return user;
    }
    return null;
  }

  public User signup(String username, String email, String password) {
    User user = new User(username, email, passwordEncoder.encode(password), true);
    return this.userMapper.insertUser(user);
  }

  public User signupFromOtp(UserOtp otp) {
    User user = new User(otp.getUsername(), otp.getEmail(), otp.getPassword(), true);
    return this.userMapper.insertUser(user);
  }

  public User findUserByUsernameOrEmail(String identifier) {
    User user = userMapper.findUserByUsernameOrEmail(identifier);
    return user;
  }

  public User findUserById(String id) {
    return userMapper.findUserById(id);
  }

  public User updateUserProfile(User user) {
    return userMapper.updateUserProfile(user);
  }

  public List<User> findUserByIdentifierBlur(String identifier) {
    return userMapper.findUserByIdentifierBlur(identifier);
  }
}
