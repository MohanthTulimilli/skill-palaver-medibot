package com.medibots.repository;

import com.medibots.entity.AiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiLogRepository extends JpaRepository<AiLog, String> {
    List<AiLog> findAllByOrderByLogTimeDesc();
}
