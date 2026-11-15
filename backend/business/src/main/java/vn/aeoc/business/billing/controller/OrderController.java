package vn.aeoc.business.billing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.billing.service.OrderService;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;

import java.security.Principal;

@RestController
public class OrderController extends BaseController {
    private final OrderService orderService;

    public OrderController(OrderService orderService, UserService userService) {
        super(userService);
        this.orderService = orderService;
    }

    @PostMapping("/order/create")
    public ResponseEntity<ApiResponse<PaymentOrder>> create(@RequestBody PaymentOrder request, Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(orderService.create(userId, request), ApiResponse::okEntity);
    }

    @GetMapping("/order/get")
    public ResponseEntity<ApiResponse<PaymentOrder>> get(@RequestParam String code, Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(orderService.get(code, userId), ApiResponse::okEntity);
    }

    @PostMapping("/order/cancel/{code}")
    public ResponseEntity<ApiResponse<PaymentOrder>> cancel(@PathVariable String code, Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(orderService.cancel(code, userId), ApiResponse::okEntity);
    }

    @GetMapping("/order/my-list")
    public ResponseEntity<ApiResponse<Page<PaymentOrder>>> myList(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(orderService.myList(userId, page, limit), ApiResponse::okEntity);
    }
}
