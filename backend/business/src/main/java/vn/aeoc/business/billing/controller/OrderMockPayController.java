package vn.aeoc.business.billing.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.billing.service.OrderService;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;

import java.security.Principal;

@Profile("local")
@RestController
public class OrderMockPayController extends BaseController {
    private final OrderService orderService;

    public OrderMockPayController(OrderService orderService, UserService userService) {
        super(userService);
        this.orderService = orderService;
    }

    @PostMapping("/order/mock-pay/{code}")
    public ResponseEntity<ApiResponse<PaymentOrder>> mockPay(@PathVariable String code, Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(orderService.mockPay(code, userId), ApiResponse::okEntity);
    }
}
