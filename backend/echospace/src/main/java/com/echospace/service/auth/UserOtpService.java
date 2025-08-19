package com.echospace.service.auth;

import com.echospace.model.auth.SignupRequest;
import com.echospace.model.auth.UserOtp;

public interface UserOtpService {
  public void saveOtp(SignupRequest request, String otp);

  public UserOtp verifyOtp(String email, String otp);

  public void cleanupExpiredOtps();

  public void deleteOtp(UserOtp otp);

}