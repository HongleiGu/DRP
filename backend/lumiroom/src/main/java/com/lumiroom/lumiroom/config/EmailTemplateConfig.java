package com.lumiroom.lumiroom.config;

import org.springframework.stereotype.Component;

@Component
public class EmailTemplateConfig {

  public String otpTemplate(String otp) {
    return """
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Hello,</p>
          <p>Your OTP code is: <strong style="color: #2E86C1; font-size: 1.2em;">%s</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>Thanks,<br/>Lumiroom Team</p>
        </body>
      </html>
    """.formatted(otp);
  }
}
