package com.echospace.service.email;

import java.io.File;

public interface EmailService {
  public void sendPlainTextEmail(String to, String subject, String text);

  public void sendHtmlEmail(String to, String subject, String htmlContent);

  public void sendEmailWithAttachment(String to, String subject, String htmlBody, File attachment);

  public void sendOTP(String to, String otp);
}
