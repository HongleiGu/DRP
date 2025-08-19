package com.echospace.utils;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

@Component
public class OtpUtils {
    private static final SecureRandom random = new SecureRandom();

    public static String generate6DigitOtp() {
        int number = random.nextInt(900000) + 100000; // ensures 6 digits, no leading zero
        return String.valueOf(number);
    }
}