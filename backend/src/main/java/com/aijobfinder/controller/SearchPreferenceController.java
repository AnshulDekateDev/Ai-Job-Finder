package com.aijobfinder.controller;

import com.aijobfinder.entity.SearchPreference;
import com.aijobfinder.repository.SearchPreferenceRepository;
import com.aijobfinder.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/search-preferences")
public class SearchPreferenceController {

    private final SearchPreferenceRepository searchPreferenceRepository;

    public SearchPreferenceController(SearchPreferenceRepository searchPreferenceRepository) {
        this.searchPreferenceRepository = searchPreferenceRepository;
    }

    @GetMapping
    public ResponseEntity<SearchPreference> getPreferences(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Optional<SearchPreference> pref = searchPreferenceRepository.findByUser(userPrincipal.getUser());
        return ResponseEntity.ok(pref.orElseGet(() -> {
            SearchPreference p = new SearchPreference();
            p.setUser(userPrincipal.getUser());
            return searchPreferenceRepository.save(p);
        }));
    }

    @PutMapping
    public ResponseEntity<SearchPreference> updatePreferences(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody SearchPreference req
    ) {
        Optional<SearchPreference> existing = searchPreferenceRepository.findByUser(userPrincipal.getUser());
        SearchPreference pref = existing.orElseGet(() -> {
            SearchPreference p = new SearchPreference();
            p.setUser(userPrincipal.getUser());
            return p;
        });

        if (req.getTargetTitlesJson() != null) pref.setTargetTitlesJson(req.getTargetTitlesJson());
        if (req.getTargetLocationsJson() != null) pref.setTargetLocationsJson(req.getTargetLocationsJson());
        if (req.getCountriesJson() != null) pref.setCountriesJson(req.getCountriesJson());
        if (req.getWorkModesJson() != null) pref.setWorkModesJson(req.getWorkModesJson());
        if (req.getExperienceRange() != null) pref.setExperienceRange(req.getExperienceRange());
        if (req.getMinMatchPercentage() != null) pref.setMinMatchPercentage(req.getMinMatchPercentage());
        if (req.getMaxResults() != null) pref.setMaxResults(req.getMaxResults());
        if (req.getSelectedSourcesJson() != null) pref.setSelectedSourcesJson(req.getSelectedSourcesJson());

        pref.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(searchPreferenceRepository.save(pref));
    }
}
