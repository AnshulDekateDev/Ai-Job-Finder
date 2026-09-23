import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job_source import JobSourceConfig
from app.models.search_preference import SearchPreference

DEFAULT_SOURCES = [
    {
        "name": "RemoteOK",
        "code": "REMOTEOK",
        "base_url": "https://remoteok.com/api",
        "access_method": "DIRECT_PUBLIC_FEED",
        "is_enabled": True,
        "is_custom": False,
        "status": "READY",
        "status_message": "Public feed active"
    },
    {
        "name": "Greenhouse",
        "code": "GREENHOUSE",
        "base_url": "https://boards-api.greenhouse.io",
        "access_method": "DIRECT_PUBLIC_FEED",
        "is_enabled": True,
        "is_custom": False,
        "status": "READY",
        "status_message": "Public board aggregation active"
    },
    {
        "name": "Lever",
        "code": "LEVER",
        "base_url": "https://api.lever.co",
        "access_method": "DIRECT_PUBLIC_FEED",
        "is_enabled": True,
        "is_custom": False,
        "status": "READY",
        "status_message": "Public board aggregation active"
    },
    {
        "name": "We Work Remotely",
        "code": "WE_WORK_REMOTELY",
        "base_url": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
        "access_method": "DIRECT_PUBLIC_FEED",
        "is_enabled": True,
        "is_custom": False,
        "status": "READY",
        "status_message": "Public RSS syndication active"
    },
    {
        "name": "Google Jobs",
        "code": "GOOGLE_JOBS",
        "base_url": "https://www.google.com/search?ibp=htl;jobs",
        "access_method": "SCRAPER_PROVIDER",
        "is_enabled": True,
        "is_custom": False,
        "status": "NEEDS_CONFIG",
        "status_message": "Requires configured Scraper Provider"
    },
    {
        "name": "Indeed",
        "code": "INDEED",
        "base_url": "https://www.indeed.com",
        "access_method": "SCRAPER_PROVIDER",
        "is_enabled": False,
        "is_custom": False,
        "status": "NEEDS_CONFIG",
        "status_message": "Requires authorized Scraper Provider"
    },
    {
        "name": "LinkedIn",
        "code": "LINKEDIN",
        "base_url": "https://www.linkedin.com/jobs",
        "access_method": "SCRAPER_PROVIDER",
        "is_enabled": False,
        "is_custom": False,
        "status": "NEEDS_CONFIG",
        "status_message": "Requires authorized Scraper Provider"
    },
    {
        "name": "Wellfound",
        "code": "WELLFOUND",
        "base_url": "https://wellfound.com/jobs",
        "access_method": "DIRECT_PUBLIC_FEED",
        "is_enabled": False,
        "is_custom": False,
        "status": "READY",
        "status_message": "Startup jobs feed"
    }
]

def initialize_user_data(user: User, db: Session):
    # Seed default Job Sources if none exist
    existing_sources = db.query(JobSourceConfig).filter(JobSourceConfig.user_id == user.id).first()
    if not existing_sources:
        for s in DEFAULT_SOURCES:
            src = JobSourceConfig(
                user_id=user.id,
                name=s["name"],
                code=s["code"],
                base_url=s["base_url"],
                access_method=s["access_method"],
                is_enabled=s["is_enabled"],
                is_custom=s["is_custom"],
                status=s["status"],
                status_message=s["status_message"],
                updated_at=datetime.utcnow()
            )
            db.add(src)

    # Seed default Search Preference if none exists
    existing_pref = db.query(SearchPreference).filter(SearchPreference.user_id == user.id).first()
    if not existing_pref:
        pref = SearchPreference(
            user_id=user.id,
            target_titles_json=json.dumps(["Java Developer", "Backend Developer", "Python Developer", "Full Stack Developer"]),
            target_locations_json=json.dumps(["India", "Remote India", "Remote Worldwide"]),
            countries_json=json.dumps(["India", "United States", "United Kingdom", "Germany", "Canada", "Australia"]),
            work_modes_json=json.dumps(["REMOTE", "HYBRID", "ON_SITE"]),
            experience_range="0-2 years",
            min_match_percentage=60.0,
            max_results=30,
            selected_sources_json=json.dumps(["REMOTEOK", "GREENHOUSE", "LEVER", "WE_WORK_REMOTELY", "GOOGLE_JOBS"]),
            updated_at=datetime.utcnow()
        )
        db.add(pref)

    db.commit()
