package com.echospace.model.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpVerificationRequest {
  private final String otp;
  private final String email; // ideally this should just contain the signup args, it should stored in the
                              // frontend somewhere anyway
}
