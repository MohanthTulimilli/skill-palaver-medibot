package com.medibots.controller;

import com.medibots.dto.AuthRequest;
import com.medibots.dto.AuthResponse;
import com.medibots.dto.SignupRequest;
import com.medibots.dto.UserDto;
import com.medibots.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        AuthResponse res = authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest req) {
        AuthResponse res = authService.signup(req);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();
        String userId = auth.getName();
        UserDto user = authService.me(userId);
        return ResponseEntity.ok(user);
    }
}
