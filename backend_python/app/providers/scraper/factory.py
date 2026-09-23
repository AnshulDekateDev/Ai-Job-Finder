from typing import NamedTuple, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.credentials import ScraperCredential
from app.security.crypto import crypto_service
from app.providers.scraper.base import ScraperProvider
from app.providers.scraper.direct_feed import DirectFeedProvider
from app.providers.scraper.scrape_do import ScrapeDoProvider
from app.providers.scraper.scraper_api import ScraperApiProvider

class ActiveScraperContext(NamedTuple):
    provider: ScraperProvider
    decrypted_api_key: Optional[str]
    base_url: Optional[str]
    provider_type: str

class ScraperProviderFactory:

    def __init__(self):
        self._providers = {
            "DIRECT_FEED": DirectFeedProvider(),
            "SCRAPE_DO": ScrapeDoProvider(),
            "SCRAPER_API": ScraperApiProvider()
        }
        self._default = DirectFeedProvider()

    def get_provider(self, provider_type: str) -> ScraperProvider:
        return self._providers.get(provider_type.upper(), self._default)

    def resolve_active_context(self, user: User, db: Session) -> ActiveScraperContext:
        cred = db.query(ScraperCredential).filter(
            ScraperCredential.user_id == user.id,
            ScraperCredential.is_active == True,
            ScraperCredential.is_default == True
        ).first()

        if not cred:
            cred = db.query(ScraperCredential).filter(
                ScraperCredential.user_id == user.id,
                ScraperCredential.is_active == True
            ).first()

        if not cred:
            return ActiveScraperContext(
                provider=self._default,
                decrypted_api_key=None,
                base_url=None,
                provider_type="DIRECT_FEED"
            )

        decrypted_key = None
        if cred.encrypted_api_key:
            try:
                decrypted_key = crypto_service.decrypt(cred.encrypted_api_key)
            except Exception:
                decrypted_key = None

        provider = self.get_provider(cred.provider_type)
        return ActiveScraperContext(
            provider=provider,
            decrypted_api_key=decrypted_key,
            base_url=cred.base_url,
            provider_type=cred.provider_type
        )

scraper_factory = ScraperProviderFactory()
