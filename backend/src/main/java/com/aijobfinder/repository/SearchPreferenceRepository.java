package com.aijobfinder.repository;

import com.aijobfinder.entity.SearchPreference;
import com.aijobfinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SearchPreferenceRepository extends JpaRepository<SearchPreference, Long> {
    Optional<SearchPreference> findByUser(User user);
}
