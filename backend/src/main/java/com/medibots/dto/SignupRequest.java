package com.medibots.dto;

public class SignupRequest {
    private String email;
    private String password;
    private String name;
    private String hospitalId;
    private String role;
    private String specialization;
    private String specializationTags;

    public String getSpecializationTags() { return specializationTags; }
    public void setSpecializationTags(String specializationTags) { this.specializationTags = specializationTags; }

    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
