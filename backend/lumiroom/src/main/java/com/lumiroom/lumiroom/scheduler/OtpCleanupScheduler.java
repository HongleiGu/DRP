package com.lumiroom.lumiroom.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.lumiroom.lumiroom.service.auth.UserOtpService;

@Component
public class OtpCleanupScheduler {

  private final UserOtpService otpService;

  public OtpCleanupScheduler(UserOtpService otpService) {
    this.otpService = otpService;
  }

  @Scheduled(fixedRate = 3600000) //1h
  public void cleanExpiredOtps() {
    otpService.cleanupExpiredOtps();
  }
}
