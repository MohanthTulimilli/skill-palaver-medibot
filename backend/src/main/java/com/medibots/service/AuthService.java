package com.medibots.service;

import com.medibots.dto.*;
import com.medibots.entity.*;
import com.medibots.repository.*;
import com.medibots.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final UserRoleRepository userRoleRepo;
    private final HospitalRepository hospitalRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepo, ProfileRepository profileRepo,
                       UserRoleRepository userRoleRepo, HospitalRepository hospitalRepo,
                       JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.userRoleRepo = userRoleRepo;
        this.hospitalRepo = hospitalRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new RuntimeException("Invalid credentials");
        Profile profile = profileRepo.findByUserId(user.getId()).orElse(null);
        UserRole role = userRoleRepo.findByUserId(user.getId()).orElseThrow(() -> new RuntimeException("No role"));
        UserDto dto = toUserDto(user, profile, role.getRole());
        String token = jwtService.generateToken(user.getId(), user.getEmail(), role.getRole());
        return new AuthResponse(token, dto);
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user = userRepo.save(user);

        Profile profile = new Profile();
        profile.setUserId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setName(req.getName() != null ? req.getName() : "");
        if (req.getHospitalId() != null && !req.getHospitalId().isEmpty())
            profile.setHospitalId(req.getHospitalId());
        if (req.getSpecialization() != null) profile.setSpecialization(req.getSpecialization());
        if (req.getSpecializationTags() != null) profile.setSpecializationTags(req.getSpecializationTags());
        profile = profileRepo.save(profile);

        String role = (req.getRole() != null && !req.getRole().isEmpty()) ? req.getRole() : "PATIENT";
        UserRole ur = new UserRole();
        ur.setUserId(user.getId());
        ur.setRole(role);
        userRoleRepo.save(ur);

        UserDto dto = toUserDto(user, profile, role);
        String token = jwtService.generateToken(user.getId(), user.getEmail(), role);
        return new AuthResponse(token, dto);
    }

    public UserDto me(String userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Profile profile = profileRepo.findByUserId(userId).orElse(null);
        UserRole role = userRoleRepo.findByUserId(userId).orElse(null);
        return toUserDto(user, profile, role != null ? role.getRole() : "PATIENT");
    }

    private UserDto toUserDto(User user, Profile profile, String role) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(profile != null ? profile.getName() : "");
        dto.setRole(role);
        dto.setAvatar(profile != null ? profile.getAvatarUrl() : null);
        dto.setHospitalId(profile != null ? profile.getHospitalId() : null);
        if (dto.getHospitalId() != null) {
            hospitalRepo.findById(dto.getHospitalId()).ifPresent(h -> dto.setHospitalName(h.getName()));
        }
        return dto;
    }
}
