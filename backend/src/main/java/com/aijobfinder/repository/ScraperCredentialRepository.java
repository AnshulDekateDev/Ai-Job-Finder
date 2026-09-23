package com.aijobfinder.repository;

import com.aijobfinder.entity.ScraperCredential;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScraperCredentialRepository extends JpaRepository<ScraperCredential, Long> {
    List<ScraperCredential> findByUser(User user);
    Optional<ScraperCredential> findByUserAndProviderType(User user, String providerType);
    Optional<ScraperCredential> findByUserAndIsDefaultTrue(User user);
    Optional<ScraperCredential> findByIdAndUser(Long id, User user);
}
