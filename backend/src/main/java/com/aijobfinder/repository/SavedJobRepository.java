package com.aijobfinder.repository;

import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.SavedJob;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    List<SavedJob> findByUserOrderBySavedAtDesc(User user);
    Optional<SavedJob> findByUserAndJob(User user, Job job);
    boolean existsByUserAndJob(User user, Job job);
    void deleteByUserAndJob(User user, Job job);
}
