package com.medibots.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "user_roles", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role"}))
public class UserRole {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
    @Column(nullable = false, length = 32)
    private String role;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
