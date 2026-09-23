import json
import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job, JobMatch
from app.providers.llm.factory import llm_factory

class MatchingEngine:

    def _normalize(self, text: str) -> str:
        if not text:
            return ""
        return re.sub(r"[^a-z0-9]", "", text.lower())

    def _parse_list(self, json_str: str) -> List[str]:
        if not json_str:
            return []
        try:
            val = json.loads(json_str)
            return val if isinstance(val, list) else []
        except Exception:
            return []

    def calculate_match(self, user: User, profile: CandidateProfile, job: Job, invoke_llm: bool, db: Session) -> JobMatch:
        candidate_skills = [s.lower().strip() for s in self._parse_list(profile.skills_json)]
        job_skills = [s.lower().strip() for s in self._parse_list(job.skills_json)]
        
        # If job has no parsed skills list, extract keywords from requirements/description
        if not job_skills and job.requirements:
            common_tech = ["python", "fastapi", "java", "spring boot", "react", "node", "sql", "postgresql", "docker", "aws", "git", "rest", "api", "graphql", "kubernetes"]
            text = (job.requirements + " " + (job.description or "")).lower()
            job_skills = [tech for tech in common_tech if tech in text]

        # 1. Skills Score (40%)
        matched_skills = []
        missing_skills = []
        if job_skills:
            for js in job_skills:
                if any(cs in js or js in cs for cs in candidate_skills):
                    matched_skills.append(js)
                else:
                    missing_skills.append(js)
            skills_ratio = len(matched_skills) / max(len(job_skills), 1)
            skills_score = min(40.0, skills_ratio * 40.0)
        else:
            skills_score = 30.0  # neutral if unlisted
            matched_skills = candidate_skills[:4]

        # 2. Experience Score (20%)
        cand_exp = profile.years_of_experience or 0.0
        min_exp = job.min_experience_required or 0.0
        max_exp = job.max_experience_required or 5.0

        if cand_exp >= min_exp:
            exp_score = 20.0
            exp_summary = f"Candidate's {cand_exp:.1f} yrs experience meets required {min_exp:.1f}+ yrs."
        else:
            diff = min_exp - cand_exp
            exp_score = max(5.0, 20.0 - (diff * 5.0))
            exp_summary = f"Role prefers {min_exp:.1f} yrs; candidate brings {cand_exp:.1f} yrs."

        # 3. Title Score (15%)
        preferred_roles = [r.lower() for r in self._parse_list(profile.preferred_roles_json)]
        job_title_norm = (job.title or "").lower()
        title_score = 5.0
        for role in preferred_roles:
            if role in job_title_norm or any(w in job_title_norm for w in role.split()):
                title_score = 15.0
                break

        # 4. Location & Remote Score (10%)
        location_score = 7.0
        loc_summary = "Location match confirmed."
        if job.remote_type == "REMOTE":
            location_score = 10.0
            loc_summary = "Fully remote position aligns with preferences."
        elif profile.location and job.location and profile.location.lower() in job.location.lower():
            location_score = 10.0
            loc_summary = f"Job is located in {job.location}, matching candidate residence."

        # 5. Education Score (5%)
        edu_score = 5.0

        # 6. Projects Score (10%)
        projects = self._parse_list(profile.projects_json)
        projects_score = min(10.0, max(5.0, len(projects) * 3.0))

        total_match_percentage = min(99.0, max(30.0, (
            skills_score + exp_score + title_score + location_score + edu_score + projects_score
        )))

        match = JobMatch(
            user_id=user.id,
            job_id=job.id,
            match_percentage=round(total_match_percentage, 1),
            skills_score=round(skills_score, 1),
            experience_score=round(exp_score, 1),
            title_score=round(title_score, 1),
            location_score=round(location_score, 1),
            education_score=round(edu_score, 1),
            projects_score=round(projects_score, 1),
            matched_skills_json=json.dumps([m.title() for m in matched_skills]),
            missing_skills_json=json.dumps([m.title() for m in missing_skills]),
            experience_summary=exp_summary,
            location_summary=loc_summary,
            match_summary=f"Strong fit with {total_match_percentage:.1f}% alignment across skills, experience, and role scope."
        )

        # Invoke LLM for top evaluated matches if enabled
        if invoke_llm:
            try:
                llm_ctx = llm_factory.resolve_active_context(user, db)
                profile_dict = {
                    "skills": candidate_skills,
                    "yearsOfExperience": cand_exp,
                    "preferredRoles": preferred_roles
                }
                job_dict = {
                    "title": job.title,
                    "company": job.company,
                    "requirements": job.requirements or job.description,
                    "skills": job_skills,
                    "remoteType": job.remote_type
                }
                analysis = llm_ctx.provider.explain_match(
                    profile_dict, job_dict, total_match_percentage,
                    api_key=llm_ctx.decrypted_api_key,
                    model_name=llm_ctx.model_name,
                    base_url=llm_ctx.base_url
                )
                if analysis.matchSummary:
                    match.match_summary = analysis.matchSummary
                if analysis.experienceSummary:
                    match.experience_summary = analysis.experienceSummary
                if analysis.locationSummary:
                    match.location_summary = analysis.locationSummary
            except Exception:
                pass  # Gracefully keep calculated fallback summaries

        return match

matching_engine = MatchingEngine()
