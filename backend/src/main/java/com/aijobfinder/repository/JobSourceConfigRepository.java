package com.aijobfinder.repository;

import com.aijobfinder.entity.JobSourceConfig;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobSourceConfigRepository extends JpaRepository<JobSourceConfig, Long> {
    List<JobSourceConfig> findByUser(User user);
    List<JobSourceConfig> findByUserAndIsEnabledTrue(User user);
    Optional<JobSourceConfig> findByUserAndCode(User user, String code);
    Optional<JobSourceConfig> findByIdAndUser(Long id, User user);
}
