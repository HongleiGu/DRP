package com.echospace.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.echospace.model.commons.Result;
import com.echospace.utils.JwtUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private ObjectMapper mapper;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {
        System.out.println("=== AuthInterceptor triggered ===");

        String url = request.getRequestURI();
        System.out.println("requesting url: " + url);
        log.info("requesting url: {}", url);

        // when login, jwt is not present
        if (url.startsWith("/api/auth")) {
            log.info("login operation, proceed");
            return true;
        }

        // get JWT
        String jwt = request.getHeader("Authorization");
        System.out.println("got jwt:" + jwt);
        log.info("received jwt token {}", jwt);

        if (!StringUtils.hasLength(jwt)) {
            log.info("header is none");
            writeJsonError(response, Result.error("NOT_LOGIN"));
            return false;
        }

        // check JWT
        try {
            JwtUtils.parseJwt(jwt);
        } catch (Throwable e) {
            log.info("error parsing token: {}", e.getMessage());
            writeJsonError(response, Result.error("You have not logged in yet"));
            return false;
        }

        log.info("token valid, proceed");
        return true;
    }

    private void writeJsonError(HttpServletResponse response, Result<String> error) throws Exception {
        response.setContentType("application/json;charset=UTF-8");
        String json = mapper.writeValueAsString(error);
        response.getWriter().write(json);
    }
}
