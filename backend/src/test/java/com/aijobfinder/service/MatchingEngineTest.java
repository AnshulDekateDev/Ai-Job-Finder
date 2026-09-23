package com.aijobfinder.service;

import com.aijobfinder.entity.CandidateProfile;
import com.aijobfinder.entity.Job;
import com.aijobfinder.entity.JobMatch;
import com.aijobfinder.entity.User;
import com.aijobfinder.provider.llm.LLMProviderFactory;
import com.aijobfinder.provider.llm.MockDemoLLMProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

public class MatchingEngineTest {

    private MatchingEngine matchingEngine;
    private ObjectMapper objectMapper;
    private LLMProviderFactory llmProviderFactory;

    @BeforeEach
    public void setup() {
        objectMapper = new ObjectMapper();
        llmProviderFactory = Mockito.mock(LLMProviderFactory.class);
        MockDemoLLMProvider mockLlm = new MockDemoLLMProvider(objectMapper);
        Mockito.when(llmProviderFactory.resolveActiveContext(Mockito.any()))
                .thenReturn(new LLMProviderFactory.ActiveLLMContext(mockLlm, "", "demo", null, "DEMO", true));

        matchingEngine = new MatchingEngine(objectMapper, llmProviderFactory);
    }

    @Test
    public void testWeightedMatchingCalculation() throws Exception {
        User user = new User("user@example.com", "hash", "John Doe");
        user.setId(1L);

        CandidateProfile profile = new CandidateProfile();
        profile.setUser(user);
        profile.setCandidateName("John Doe");
        profile.setYearsOfExperience(2.0);
        profile.setSkillsJson(objectMapper.writeValueAsString(Arrays.asList("Java", "Spring Boot", "REST API", "PostgreSQL", "Docker")));
        profile.setPreferredRolesJson(objectMapper.writeValueAsString(Arrays.asList("Java Developer", "Backend Developer")));
        profile.setLocationsJson(objectMapper.writeValueAsString(Arrays.asList("India", "Remote Worldwide")));
        profile.setRemotePreferenceJson(objectMapper.writeValueAsString(Arrays.asList("REMOTE")));

        Job job = new Job();
        job.setId(101L);
        job.setTitle("Senior Java Backend Developer");
        job.setCompany("Tech Giants");
        job.setLocation("Remote");
        job.setRemoteType("REMOTE");
        job.setMinExperienceRequired(1.0);
        job.setMaxExperienceRequired(3.0);
        job.setSkillsJson(objectMapper.writeValueAsString(Arrays.asList("Java", "Spring Boot", "REST API", "PostgreSQL", "AWS")));

        JobMatch match = matchingEngine.calculateMatch(user, profile, job, false);

        assertNotNull(match);
        assertTrue(match.getMatchPercentage() >= 75.0, "Expected match percentage >= 75%, got: " + match.getMatchPercentage());
        assertNotNull(match.getSkillsScore());
        assertNotNull(match.getExperienceScore());
        assertNotNull(match.getTitleScore());
        assertNotNull(match.getLocationScore());
        assertNotNull(match.getMatchSummary());
    }
}
