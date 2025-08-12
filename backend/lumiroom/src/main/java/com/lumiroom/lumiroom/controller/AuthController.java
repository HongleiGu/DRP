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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * REST controller that handles authentication-related endpoints such as
 * login, OTP (One-Time Password) generation, OTP verification, and
 * username/email availability checks.
 * <p>
 * This controller exposes endpoints under the base path {@code /api/auth}.
 * It uses {@link AuthService} for authentication logic, {@link UserOtpService}
 * for OTP storage/verification,
 * and {@link EmailService} for sending OTPs to users.
 * <p>
 * Security considerations:
 * <ul>
 * <li>All endpoints should ideally be rate-limited to prevent brute force or
 * OTP spamming.</li>
 * <li>OTP responses should not expose the OTP in production; here it is
 * returned for demonstration/testing purposes.</li>
 * <li>JWT generation uses {@link JwtUtils} to embed user details in a signed
 * token.</li>
 * </ul>
 *
 * @author Honglei Gu
 * @since 1.0
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final UserOtpService otpService;
  private final EmailService emailService;

  /**
   * Constructs a new {@code AuthController}.
   *
   * @param authService  the service for authentication and user management
   * @param otpService   the service for handling OTP generation, verification,
   *                     and storage
   * @param emailService the service for sending emails, such as OTP notifications
   */
  public AuthController(
      AuthService authService,
      UserOtpService otpService,
      EmailService emailService) {
    this.authService = authService;
    this.otpService = otpService;
    this.emailService = emailService;
  }

  /**
   * Authenticates a user using their username/email and password.
   * <p>
   * On success, returns a {@link Result} containing an {@link AuthResponse}
   * with the authenticated {@link User} and a signed JWT token.
   * <p>
   * Possible failure scenarios:
   * <ul>
   * <li>Invalid credentials (HTTP 401)</li>
   * <li>Unexpected server error (HTTP 500)</li>
   * </ul>
   *
   * @param req a {@link LoginRequest} containing:
   *            <ul>
   *            <li>{@code identifier} – username or email</li>
   *            <li>{@code password} – plaintext password</li>
   *            </ul>
   * @return a {@link Result} containing the authentication outcome:
   *         <ul>
   *         <li>{@code 200} on success with JWT</li>
   *         <li>{@code 401} on authentication failure</li>
   *         <li>{@code 500} on server error</li>
   *         </ul>
   */
  @PostMapping("/login")
  public Result<AuthResponse> login(@RequestBody LoginRequest req) {
    try {
      String identifier = req.getIdentifier();
      String password = req.getPassword();
      System.out.println("password" + password);

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

  /**
   * Requests a new OTP for user signup and sends it via email.
   * <p>
   * The OTP expires after one hour and is stored using {@link UserOtpService}.
   * <p>
   * In production, the OTP should not be returned in the API response; here it is
   * included for testing/debugging.
   *
   * @param request a {@link SignupRequest} containing the email and any other
   *                relevant signup details
   * @return a {@link Result} containing:
   *         <ul>
   *         <li>The generated OTP (for testing purposes)</li>
   *         <li>Message indicating the OTP was sent</li>
   *         </ul>
   *         or an error message on failure.
   */
  @PostMapping("/requestOtp")
  public Result<String> requestOtp(@RequestBody SignupRequest request) {
    try {
      String otp = OtpUtils.generate6DigitOtp();
      otpService.saveOtp(request, otp);
      emailService.sendOTP(request.getEmail(), otp);

      return Result.success(otp, "otp send to your email, please note this otp expires in a hour");
    } catch (Throwable e) {
      return Result.success("failed to send otp due to the following error: " + e.getMessage());
    }
  }

  /**
   * Verifies an OTP for a given email and creates a new user account if valid.
   * <p>
   * On successful OTP verification:
   * <ul>
   * <li>The OTP record is deleted from storage</li>
   * <li>A new {@link User} is created via
   * {@link AuthService#signupFromOtp(UserOtp)}</li>
   * </ul>
   *
   * @param request an {@link OtpVerificationRequest} containing:
   *                <ul>
   *                <li>{@code email} – email used to request the OTP</li>
   *                <li>{@code otp} – the code sent via email</li>
   *                </ul>
   * @return a {@link Result} containing:
   *         <ul>
   *         <li>The created {@link User} on success</li>
   *         <li>Error message if OTP is invalid or user creation fails</li>
   *         </ul>
   */
  @PostMapping("/verifyOtp")
  public Result<User> verifyOtp(@RequestBody OtpVerificationRequest request) {
    try {
      UserOtp otp = otpService.verifyOtp(request.getEmail(), request.getOtp());
      if (otp == null) {
        return Result.error(400, "Invalid OTP");
      }
      User user = authService.signupFromOtp(otp);
      otpService.deleteOtp(otp);
      return Result.success(user);
    } catch (Throwable e) {
      return Result.error(500, "otp verified but cannot signup due to error: " + e.getMessage());
    }
  }

  /**
   * Checks whether a username or email is already registered.
   * <p>
   * This endpoint can be used during signup to validate username/email
   * availability.
   *
   * @param identifier the username or email to check
   * @return a {@link Result} containing:
   *         <ul>
   *         <li>{@code true} if the identifier is already registered</li>
   *         <li>{@code false} if it is available</li>
   *         </ul>
   *         along with an explanatory message.
   */
  @GetMapping("/checkUsername")
  public Result<Boolean> checkUsername(@RequestParam String identifier) {
    try {
      User user = authService.findUserByUsernameOrEmail(identifier);
      if (user == null) {
        return Result.success(false, "the username or email is not registered");
      }
      return Result.success(true, "the username or email is already registered");
    } catch (Throwable e) {
      return Result.error(500, "An error occured when checking email or username: " + e.getMessage());
    }
  }

  @PostMapping("/updateUserProfile")
  public Result<User> updateUserProfile(@RequestBody User user) {
    try {
      User updatedUser = authService.updateUserProfile(user);
      return Result.success(updatedUser, "profile updated successfully");
    } catch (Throwable e) {
      return Result.error(500, "An error occured when updating user profile" + e.getMessage());
    }
  }
}
