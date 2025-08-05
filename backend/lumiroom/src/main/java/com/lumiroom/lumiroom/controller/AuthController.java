package com.lumiroom.lumiroom.controller;

import org.springframework.web.bind.annotation.RestController;

import com.lumiroom.lumiroom.model.Result;
import com.lumiroom.lumiroom.model.auth.SignupRequest;
import com.lumiroom.lumiroom.model.User;
import com.lumiroom.lumiroom.model.auth.AuthResponse;
import com.lumiroom.lumiroom.model.auth.LoginRequest;
import com.lumiroom.lumiroom.model.auth.OtpVerificationRequest;
import com.lumiroom.lumiroom.service.auth.AuthService;
import com.lumiroom.lumiroom.service.auth.UserOtpService;
import com.lumiroom.lumiroom.utils.JwtUtils;
import com.lumiroom.lumiroom.utils.OtpUtils;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
// import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final UserOtpService otpService;

  public AuthController(AuthService authService, UserOtpService otpService) {
    this.authService = authService;
    this.otpService = otpService;
  }

  /**
   * the login api
   * @param a LoginRequest class object, includes
   *        identifier, which may be username or email
   *        password, the unhashed password
   * @return Result, 200 if success, 500 if server error, 401 if credentials fail
   */
  @PostMapping("/login")
  public Result<AuthResponse> login(@RequestBody LoginRequest req) {
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
  }

  // @PostMapping("/signup") // this should not be triggered as a controller function, or else we might have db flooding
  // public Result<AuthResponse> signup(@RequestBody SignupRequest req) {
  //   String username = req.getUsername();
  //   String email = req.getPassword();
  //   String passwordHased = passwordEncoder.encode(req.getPassword());

  //   User user = authService.
  // }

  @PostMapping("/request-otp")
  public Result<String> requestOtp(@RequestBody SignupRequest request) {
    // Ideally, check for existing user/email to prevent flooding here
    String otp = OtpUtils.generate6DigitOtp();
    otpService.saveOtp(request.getEmail(), otp);

      
    return Result.success(otp, "otp send, please note this otp expires in a hour");
  }

  // Step 2: Verify OTP and create user
  @PostMapping("/verify-otp")
  public Result<String> verifyOtp(@RequestBody OtpVerificationRequest request) {
    if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
      return Result.error(400, "Invalid OTP");
    }
    return Result.success("otp verfied");
  }
}
