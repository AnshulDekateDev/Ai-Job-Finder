package com.aijobfinder.repository;

import com.aijobfinder.entity.Application;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Application> findByUserAndJob(User user, Job job);
}
