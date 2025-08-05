package com.lumiroom.lumiroom.service.auth;

public interface UserOtpService {
  public void saveOtp(String email, String otp);

  public boolean verifyOtp(String email, String otp);

  public void cleanupExpiredOtps();
}