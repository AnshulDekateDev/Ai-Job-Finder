package com.aijobfinder.controller;

import com.aijobfinder.entity.User;
import com.aijobfinder.repository.UserRepository;
import com.aijobfinder.security.JwtTokenProvider;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.service.DataInitializer;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final DataInitializer dataInitializer;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            DataInitializer dataInitializer
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.dataInitializer = dataInitializer;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signUpRequest) {
        String email = signUpRequest.get("email");
        String password = signUpRequest.get("password");
        String fullName = signUpRequest.get("fullName");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(CollectionsMap("error", "Email and password are required"));
        }

        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(CollectionsMap("error", "Email is already registered. Please sign in."));
        }

        User user = new User(
                email.trim().toLowerCase(),
                passwordEncoder.encode(password),
                fullName != null && !fullName.trim().isEmpty() ? fullName.trim() : "Job Seeker"
        );
        user = userRepository.save(user);

        // Seed starter job sources and default settings for this specific user
        dataInitializer.initializeUserData(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email.trim().toLowerCase(), password)
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        Map<String, Object> res = new HashMap<>();
        res.put("token", jwt);
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        res.put("fullName", user.getFullName());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email.trim().toLowerCase(), password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            Map<String, Object> res = new HashMap<>();
            res.put("token", jwt);
            res.put("userId", principal.getId());
            res.put("email", principal.getUsername());
            res.put("fullName", principal.getFullName());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(CollectionsMap("error", "Invalid email or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(CollectionsMap("error", "Not authenticated"));
        }
        Map<String, Object> res = new HashMap<>();
        res.put("userId", principal.getId());
        res.put("email", principal.getUsername());
        res.put("fullName", principal.getFullName());
        return ResponseEntity.ok(res);
    }

    private Map<String, String> CollectionsMap(String k, String v) {
        Map<String, String> m = new HashMap<>();
        m.put(k, v);
        return m;
    }
}
