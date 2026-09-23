package com.aijobfinder.repository;

import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.JobMatch;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobMatchRepository extends JpaRepository<JobMatch, Long> {
    List<JobMatch> findByUserOrderByMatchPercentageDesc(User user);
    Optional<JobMatch> findByUserAndJob(User user, Job job);
    void deleteByUser(User user);
}
