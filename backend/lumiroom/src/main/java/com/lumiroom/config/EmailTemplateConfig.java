package com.lumiroom.config;

import org.springframework.stereotype.Component;

/**
 * Provides HTML email templates used by the application.
 * <p>
 * This component centralizes template definitions so that
 * email content is consistent and easy to maintain.
 * Currently, it contains the template for sending OTP codes.
 * </p>
 *
 * <p>
 * <b>Usage:</b>
 * </p>
 * 
 * <pre>{@code
 * @Autowired
 * private EmailTemplateConfig emailTemplateConfig;
 *
 * String htmlBody = emailTemplateConfig.otpTemplate("123456");
 * emailService.sendEmail(userEmail, "Your OTP Code", htmlBody);
 * }</pre>
 *
 * <p>
 * <b>Thread Safety:</b> This class is stateless and therefore thread-safe.
 * </p>
 *
 * @author Honglei Gu
 * @since 1.0
 */
@Component
public class EmailTemplateConfig {

  /**
   * Generates an HTML-formatted OTP email.
   * <p>
   * The generated email includes:
   * <ul>
   * <li>A greeting</li>
   * <li>The provided OTP code in a highlighted style</li>
   * <li>An expiration note (5 minutes)</li>
   * <li>A closing signature</li>
   * </ul>
   * </p>
   *
   * @param otp the one-time password to include in the email
   * @return a complete HTML email string with the given OTP inserted
   */
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
