package com.aijobfinder.repository;

import com.aijobfinder.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    Optional<Job> findByExternalIdAndSourceCode(String externalId, String sourceCode);
}
