package com.echospace.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.echospace.service.email.EmailService;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    // Example endpoint to send a test plain-text email
    @PostMapping("/sendTest")
    public String sendTestEmail(@RequestParam String to) {
        try {
            emailService.sendPlainTextEmail(
                    to,
                    "Test Email from Spring Boot",
                    "This is a test email sent via the Spring Boot email service.");
            return "Email sent successfully to " + to;
        } catch (Throwable e) {
            e.printStackTrace();
            return "Failed to send email: " + e.getMessage();
        }
    }

    // endpoint for testing otp sending utilities
    @PostMapping("/sendTestOtp")
    public String sendTestOtp(@RequestParam String to, @RequestParam String otp) {
        try {
            emailService.sendOTP(to, otp);
            return "Email sent successfully to " + to;
        } catch (Throwable e) {
            e.printStackTrace();
            return "Failed to send email: " + e.getMessage();
        }
    }
}
