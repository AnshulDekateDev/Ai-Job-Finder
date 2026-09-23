from typing import Optional
import httpx
from app.providers.scraper.base import ScraperProvider

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
}

class DirectFeedProvider(ScraperProvider):

    def get_provider_type(self) -> str:
        return "DIRECT_FEED"

    async def fetch_page(self, url: str, api_key: Optional[str] = None, base_url: Optional[str] = None) -> str:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=DEFAULT_HEADERS) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text

    async def test_connection(self, api_key: str, base_url: Optional[str] = None) -> bool:
        return True
