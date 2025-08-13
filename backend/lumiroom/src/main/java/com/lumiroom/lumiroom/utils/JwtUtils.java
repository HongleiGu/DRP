package com.lumiroom.lumiroom.utils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Profile;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Profile("auth")
public class JwtUtils {
  private static String signKey = "lumiroom";
  private static Long expire = 43200000L; // a day

  public static String generateJwt(Map<String, Object> claims) {
    String jwt = Jwts.builder()
        .signWith(SignatureAlgorithm.HS256, signKey) // 设置签名算法
        .setClaims(claims) // 设置数据
        .setExpiration(new Date(System.currentTimeMillis() + expire)) // 设置有效时间
        .compact(); // 转为字符串
    return jwt;
  }

  public static Claims parseJwt(String jwt) {
    try {
      Claims claims = Jwts.parser()
          .setSigningKey(signKey) // 设置秘钥
          .parseClaimsJws(jwt)
          .getBody();
      return claims;
    } catch (Throwable e) {
      return null;
    }
  }

  public static boolean isExpired(String jwt) {
    Claims claims = parseJwt(jwt);
    if (claims == null) {
      return true; // treat parsing errors as expired/invalid
    }
    Date expiration = claims.getExpiration();
    return expiration == null || expiration.before(new Date()); // maybe expiration cannot be null, but writing it down
                                                                // for safety check
  }
}
