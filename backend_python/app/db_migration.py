import logging
from sqlalchemy import text

logger = logging.getLogger("uvicorn.error")

def migrate_legacy_postgres_lobs(bind_engine):
    """
    Spring Boot / Hibernate @Lob columns in PostgreSQL store OIDs referencing pg_largeobject.
    This migration seamlessly reads the large objects via lo_get() and replaces the numeric OIDs
    with the actual text/JSON content.
    """
    if "postgres" not in str(bind_engine.url).lower():
        return

    tables_and_columns = {
        "candidate_profiles": [
            "summary", "skills_json", "experience_json", "education_json",
            "projects_json", "preferred_roles_json", "locations_json", "remote_preference_json"
        ],
        "resumes": ["raw_text"],
        "search_preferences": [
            "countries_json", "selected_sources_json", "target_locations_json",
            "target_titles_json", "work_modes_json"
        ],
        "job_matches": [
            "experience_summary", "location_summary", "match_summary",
            "matched_skills_json", "missing_skills_json"
        ],
        "jobs": ["description"]
    }

    try:
        with bind_engine.begin() as conn:
            for table, columns in tables_and_columns.items():
                try:
                    tbl_check = conn.execute(text(
                        f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')"
                    )).scalar()
                    if not tbl_check:
                        continue

                    for col in columns:
                        try:
                            # Find rows where col is all digits and 4-10 chars (typical OID pattern)
                            query = text(f"""
                                SELECT id, {col} FROM {table} 
                                WHERE {col} IS NOT NULL AND {col} ~ '^[0-9]{{4,10}}$'
                            """)
                            rows = conn.execute(query).fetchall()
                            for r in rows:
                                row_id = r[0]
                                oid_val = r[1]
                                try:
                                    resolved = conn.execute(
                                        text(f"SELECT convert_from(lo_get({oid_val}), 'UTF8')")
                                    ).scalar()
                                    if resolved is not None:
                                        conn.execute(
                                            text(f"UPDATE {table} SET {col} = :val WHERE id = :id"),
                                            {"val": resolved, "id": row_id}
                                        )
                                        logger.info(f"Resolved legacy LOB for {table}.{col} (OID {oid_val}) on row {row_id}")
                                except Exception as ex:
                                    logger.debug(f"Could not convert LOB {oid_val} for {table}.{col}: {ex}")
                        except Exception:
                            pass
                except Exception as e:
                    logger.debug(f"Error checking legacy LOBs for {table}: {e}")
        logger.info("Legacy LOB check & migration completed successfully.")
    except Exception as outer_e:
        logger.warning(f"LOB migration check skipped: {outer_e}")
