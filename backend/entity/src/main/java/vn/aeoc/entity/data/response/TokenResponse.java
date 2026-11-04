package vn.aeoc.entity.data.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TokenResponse {
    // Access token (JWT, ngắn hạn: security.jwt.expired-in)
    private String token;
    // Dùng 1 lần ở POST /auth/refresh để lấy cặp token mới (dài hạn: security.jwt.refresh-expired-in)
    private String refreshToken;
    private Integer userId;

    public TokenResponse() {
    }

    public TokenResponse(String token, String refreshToken, Integer userId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
    }
}