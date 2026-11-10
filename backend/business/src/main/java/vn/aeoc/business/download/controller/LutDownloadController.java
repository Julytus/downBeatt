package vn.aeoc.business.download.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.download.service.LutDownloadService;
import vn.aeoc.entity.data.mysql.download.DownloadLog;

import java.security.Principal;
import java.time.LocalDate;

@RestController
public class LutDownloadController extends BaseController {
    private final LutDownloadService lutDownloadService;

    public LutDownloadController(LutDownloadService lutDownloadService, UserService userService) {
        super(userService);
        this.lutDownloadService = lutDownloadService;
    }

    @PostMapping("/lut/download")
    public ResponseEntity<ApiResponse<DownloadLog>> download(
            @RequestBody(required = false) DownloadLog body,
            Principal principal,
            HttpServletRequest request) {
        Integer userId = SecurityUtils.userId(principal);
        Integer lutId = body != null ? body.getLutId() : null;
        String ip = resolveIp(request);
        DownloadLog result = lutDownloadService.download(userId, lutId, ip, LocalDate.now());
        return Mapper.map(result, ApiResponse::okEntity);
    }

    private static String resolveIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String xff = request.getHeader("X-Forwarded-For");
        String ip = null;
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            if (parts.length > 0 && !parts[0].isBlank()) {
                ip = parts[0].trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        if (ip != null) {
            ip = ip.trim();
            if (ip.length() > 45) {
                ip = ip.substring(0, 45);
            }
        }
        return (ip == null || ip.isBlank()) ? null : ip;
    }
}
