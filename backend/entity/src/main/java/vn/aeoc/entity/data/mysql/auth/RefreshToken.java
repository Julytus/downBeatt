package vn.aeoc.entity.data.mysql.auth;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RefreshToken {
    private Long id;
    private Integer userId;
    private String tokenHash;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
