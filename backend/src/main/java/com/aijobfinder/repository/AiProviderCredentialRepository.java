package com.aijobfinder.repository;

import com.aijobfinder.entity.AiProviderCredential;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiProviderCredentialRepository extends JpaRepository<AiProviderCredential, Long> {
    List<AiProviderCredential> findByUser(User user);
    Optional<AiProviderCredential> findByUserAndProviderType(User user, String providerType);
    Optional<AiProviderCredential> findByUserAndIsDefaultTrue(User user);
    Optional<AiProviderCredential> findByIdAndUser(Long id, User user);
}
