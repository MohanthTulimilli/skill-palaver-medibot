package com.medibots.config;

import com.medibots.entity.*;
import com.medibots.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final UserRoleRepository userRoleRepo;
    private final HospitalRepository hospitalRepo;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepo, ProfileRepository profileRepo,
                     UserRoleRepository userRoleRepo, HospitalRepository hospitalRepo,
                     PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.userRoleRepo = userRoleRepo;
        this.hospitalRepo = hospitalRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) return;
        seedAdmin();
    }

    private void seedAdmin() {
        User admin = new User();
        admin.setEmail("admin@medibots.com");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin = userRepo.save(admin);

        Profile p = new Profile();
        p.setUserId(admin.getId());
        p.setEmail(admin.getEmail());
        p.setName("Super Admin");
        profileRepo.save(p);

        UserRole ur = new UserRole();
        ur.setUserId(admin.getId());
        ur.setRole("SUPER_ADMIN");
        userRoleRepo.save(ur);
    }
}
