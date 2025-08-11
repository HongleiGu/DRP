package com.lumiroom.lumiroom.model.commons;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private int code;
    private T data;
    private String msg;

    // ✅ Success response with data
    public static <T> Result<T> success(T data) {
        return Result.<T>builder()
                .code(200)
                .data(data)
                .msg("success")
                .build();
    }

    // ✅ Success response with custom message
    public static <T> Result<T> success(T data, String msg) {
        return Result.<T>builder()
                .code(200)
                .data(data)
                .msg(msg)
                .build();
    }

    // ❌ Error response
    public static <T> Result<T> error(int code, String msg) {
        return Result.<T>builder()
                .code(code)
                .data(null)
                .msg(msg)
                .build();
    }

    // ❌ Default 500 error
    public static <T> Result<T> error(String msg) {
        return error(500, msg);
    }

}
