package vn.aeoc.business.account.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.account.service.AccountService;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.response.TokenResponse;

import java.security.Principal;

@RestController
public class AccountController extends BaseController {
    private final AccountService accountService;

    public AccountController(AccountService accountService, UserService userService) {
        super(userService);
        this.accountService = accountService;
    }

    @PostMapping("/account/register")
    public ResponseEntity<ApiResponse<TokenResponse>> register(@RequestBody User request) {
        return Mapper.map(accountService.register(request), ApiResponse::okEntity);
    }

    @GetMapping("/account/me")
    public ResponseEntity<ApiResponse<User>> me(Principal principal) {
        return Mapper.map(accountService.me(SecurityUtils.userId(principal)), ApiResponse::okEntity);
    }
}
