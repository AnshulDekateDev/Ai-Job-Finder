package com.aijobfinder.repository;

import com.aijobfinder.entity.CoverLetter;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {
    List<CoverLetter> findByUserOrderByCreatedAtDesc(User user);
    Optional<CoverLetter> findByUserAndJob(User user, Job job);
}
