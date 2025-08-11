package com.lumiroom.lumiroom.service.auth;

import com.lumiroom.lumiroom.model.auth.SignupRequest;
import com.lumiroom.lumiroom.model.auth.UserOtp;

public interface UserOtpService {
  public void saveOtp(SignupRequest request, String otp);

  public UserOtp verifyOtp(String email, String otp);

  public void cleanupExpiredOtps();

  public void deleteOtp(UserOtp otp);

}