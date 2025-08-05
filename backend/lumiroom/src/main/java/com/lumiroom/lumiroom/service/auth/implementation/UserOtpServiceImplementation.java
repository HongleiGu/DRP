package com.lumiroom.lumiroom.service.auth.implementation;

import com.lumiroom.lumiroom.service.auth.UserOtpService;
import com.lumiroom.lumiroom.mapper.UserOtpMapper;
import com.lumiroom.lumiroom.model.UserOtp;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserOtpServiceImplementation implements UserOtpService {

    private final UserOtpMapper otpMapper;

    public UserOtpServiceImplementation(UserOtpMapper otpMapper) {
        this.otpMapper = otpMapper;
    }

    public void saveOtp(String email, String otp) {
        UserOtp userOtp = new UserOtp(otp, email);
        otpMapper.insertOtp(userOtp);
    }

    public boolean verifyOtp(String email, String otp) {
        UserOtp userOtp = otpMapper.findValidOtp(email, otp);
        if (userOtp != null) {
            otpMapper.deleteOtp(userOtp.getId());
            return true;
        }
        return false;
    }

    public void cleanupExpiredOtps() {
        otpMapper.deleteExpiredOtps();
    }
}
