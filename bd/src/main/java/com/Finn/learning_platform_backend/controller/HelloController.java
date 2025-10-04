package com.Finn.learning_platform_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot! 当前时间: " + LocalDateTime.now();
    }

    @GetMapping("/test")
    public String test() {
        return "这是一个测试接口 - Spring Boot热更新功能正常工作！";
    }
}
