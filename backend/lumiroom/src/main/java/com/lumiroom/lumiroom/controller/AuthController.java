package com.lumiroom.lumiroom.controller;

import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.lumiroom.model.auth.SignupRequest;
import com.lumiroom.lumiroom.model.auth.UserOtp;
import com.lumiroom.lumiroom.model.commons.Result;
import com.lumiroom.lumiroom.model.commons.User;
import com.lumiroom.lumiroom.model.auth.AuthResponse;
import com.lumiroom.lumiroom.model.auth.LoginRequest;
import com.lumiroom.lumiroom.model.auth.OtpVerificationRequest;
import com.lumiroom.lumiroom.service.auth.AuthService;
import com.lumiroom.lumiroom.service.auth.UserOtpService;
import com.lumiroom.lumiroom.service.email.EmailService;
import com.lumiroom.lumiroom.utils.JwtUtils;
import com.lumiroom.lumiroom.utils.OtpUtils;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final UserOtpService otpService;
  private final EmailService emailService;

  public AuthController(
      AuthService authService,
      UserOtpService otpService,
      EmailService emailService) {
    this.authService = authService;
    this.otpService = otpService;
    this.emailService = emailService;
  }

  /**
   * the login api
   * 
   * @param a LoginRequest class object, includes
   *          identifier, which may be username or email
   *          password, the unhashed password
   * @return Result, 200 if success, 500 if server error, 401 if credentials fail
   */
  @PostMapping("/login")
  public Result<AuthResponse> login(@RequestBody LoginRequest req) {
    try {
      String identifier = req.getIdentifier();
      String password = req.getPassword();

      User user = authService.authenticate(identifier, password);
      if (user == null) {
        return Result.error(401, "wrong credentials, please try again");
      }

      Map<String, Object> claims = new HashMap<>();
      claims.put("id", user.getId());
      claims.put("username", user.getUsername());
      claims.put("email", user.getEmail());

      String token = JwtUtils.generateJwt(claims);

      return Result.success(new AuthResponse(user, token), "login success");
    } catch (Throwable e) {
      return Result.error("login failed due to error: " + e.getMessage());
    }
  }

  @PostMapping("/requestOtp")
  public Result<String> requestOtp(@RequestBody SignupRequest request) {
    // Ideally, check for existing user/email to prevent flooding here
    try {
      String otp = OtpUtils.generate6DigitOtp();
      otpService.saveOtp(request, otp);
      // some email service to send the otp

      emailService.sendOTP(request.getEmail(), otp);

      return Result.success(otp, "otp send to your email, please note this otp expires in a hour");
    } catch (Throwable e) {
      return Result.success("failed to send otp due to the following error: " + e.getMessage());
    }
  }

  @PostMapping("/verifyOtp")
  public Result<String> verifyOtp(@RequestBody OtpVerificationRequest request) {
    try {
      UserOtp otp = otpService.verifyOtp(request.getEmail(), request.getOtp());
      if (otp == null) {
        return Result.error(400, "Invalid OTP");
      }
      System.out.println(otp);
      authService.signupFromOtp(otp);
      otpService.deleteOtp(otp);
    } catch (Throwable e) {
      return Result.error(500, "otp verified but cannot signup due to error: " + e.getMessage());
    }
    return Result.success("otp verfied and signed up");
  }

  @GetMapping("/checkUsername")
  public Result<Boolean> checkUsername(@RequestParam String identifier) {
    try {
      User user = authService.findUserByUsernameOrEmail(identifier);
      if (user == null) {
        return Result.success(false, "the username or email is not registered");
      }
      return Result.success(true, "the username or email is already registered");
    } catch (Throwable e) {
      return Result.error(500, "An error occured when checking email of username: " + e.getMessage());
    }
  }
}
