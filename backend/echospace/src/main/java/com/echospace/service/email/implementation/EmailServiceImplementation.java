package com.echospace.service.email.implementation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.*;
import org.springframework.stereotype.Service;

import com.echospace.config.EmailTemplateConfig;
import com.echospace.service.email.EmailService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.File;

@Slf4j
@Service
public class EmailServiceImplementation implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailTemplateConfig templateConfig;

    @Value("${email.sender}")
    private String fromEmail;

    public void sendPlainTextEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Plain text email sent to {}", to);
        } catch (Throwable e) {
            log.error("Failed to send plain text email to {}: {}", to, e.getMessage(), e);
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mime);
            log.info("HTML email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage(), e);
        }
    }

    public void sendEmailWithAttachment(String to, String subject, String htmlBody, File attachment) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.addAttachment(attachment.getName(), new FileSystemResource(attachment));
            mailSender.send(mime);
            log.info("Email with attachment sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
        }
    }

    public void sendOTP(String to, String otp) {
        try {
            String htmlContent = templateConfig.otpTemplate(otp);
            sendHtmlEmail(to, "Your OTP Code", htmlContent);
            log.info("OTP email sent to {}", to);
        } catch (Throwable e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage(), e);
        }
    }
}
