from abc import ABC, abstractmethod
from typing import Optional

class ScraperProvider(ABC):

    @abstractmethod
    def get_provider_type(self) -> str:
        pass

    @abstractmethod
    async def fetch_page(self, url: str, api_key: Optional[str] = None, base_url: Optional[str] = None) -> str:
        pass

    @abstractmethod
    async def test_connection(self, api_key: str, base_url: Optional[str] = None) -> bool:
        pass
