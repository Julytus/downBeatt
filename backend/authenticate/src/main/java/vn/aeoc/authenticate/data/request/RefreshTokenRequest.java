package vn.aeoc.authenticate.data.request;

import lombok.Data;

/** Body của POST /auth/refresh và /auth/logout. */
@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
