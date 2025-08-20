package com.lumiroom.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.lumiroom.model.auth.UserOtp;

@Mapper
public interface UserOtpMapper {
    void insertOtp(UserOtp otp);

    UserOtp findValidOtp(@Param("email") String email, @Param("otp") String otp);

    void deleteOtp(String id);

    void deleteExpiredOtps();
}
