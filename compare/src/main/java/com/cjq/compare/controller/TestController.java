package com.cjq.compare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * RESTful 风格测试接口
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    /**
     * GET /api/test - 测试接口
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTest() {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Hello, Compare API!");
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", "ok");
        return ResponseEntity.ok(body);
    }
}
