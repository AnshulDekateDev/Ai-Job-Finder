from typing import Optional
import urllib.parse
import httpx
from app.providers.scraper.base import ScraperProvider

class ScraperApiProvider(ScraperProvider):

    def get_provider_type(self) -> str:
        return "SCRAPER_API"

    async def fetch_page(self, url: str, api_key: Optional[str] = None, base_url: Optional[str] = None) -> str:
        if not api_key:
            raise ValueError("ScraperAPI requires an API key.")
        
        encoded_target = urllib.parse.quote(url, safe="")
        endpoint = f"https://api.scraperapi.com?api_key={api_key}&url={encoded_target}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(endpoint)
            res.raise_for_status()
            return res.text

    async def test_connection(self, api_key: str, base_url: Optional[str] = None) -> bool:
        if not api_key or not api_key.strip():
            return False
        try:
            test_target = urllib.parse.quote("https://httpbin.org/ip", safe="")
            endpoint = f"https://api.scraperapi.com?api_key={api_key}&url={test_target}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(endpoint)
                return res.status_code == 200
        except Exception:
            return False
