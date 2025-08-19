package com.echospace.service.auth.implementation;

import com.echospace.service.auth.UserOtpService;

import lombok.extern.slf4j.Slf4j;

import com.echospace.mapper.UserOtpMapper;
import com.echospace.model.auth.SignupRequest;
import com.echospace.model.auth.UserOtp;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class UserOtpServiceImplementation implements UserOtpService {

    private final UserOtpMapper otpMapper;
    private final PasswordEncoder encoder;

    public UserOtpServiceImplementation(UserOtpMapper otpMapper, PasswordEncoder encoder) {
        this.otpMapper = otpMapper;
        this.encoder = encoder;
    }

    public void saveOtp(SignupRequest request, String otp) {
        UserOtp userOtp = new UserOtp(otp, new SignupRequest(
                request.getUsername(),
                request.getEmail(),
                encoder.encode(request.getPassword())));
        otpMapper.insertOtp(userOtp);
    }

    public UserOtp verifyOtp(String email, String otp) {
        UserOtp userOtp = otpMapper.findValidOtp(email, otp);
        return userOtp;
        // if (userOtp != null) {
        // otpMapper.deleteOtp(userOtp.getId());
        // return userOtp;
        // }
        // return null;
    }

    public void deleteOtp(UserOtp otp) {
        otpMapper.deleteOtp(otp.getId());
    }

    public void cleanupExpiredOtps() {
        otpMapper.deleteExpiredOtps();
    }
}
