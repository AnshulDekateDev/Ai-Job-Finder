package com.aijobfinder.controller;

import com.aijobfinder.entity.Application;
import com.aijobfinder.security.UserPrincipal;
import com.aijobfinder.service.ApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public ResponseEntity<List<Application>> getApplications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(applicationService.getUserApplications(userPrincipal.getUser()));
    }

    @PostMapping("/jobs/{jobId}/apply")
    public ResponseEntity<?> recordApplication(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String status = (body != null && body.containsKey("status")) ? body.get("status") : "APPLICATION_STARTED";
        String notes = (body != null) ? body.get("notes") : null;

        Application app = applicationService.recordApplication(userPrincipal.getUser(), jobId, status, notes);
        return ResponseEntity.ok(app);
    }
}
