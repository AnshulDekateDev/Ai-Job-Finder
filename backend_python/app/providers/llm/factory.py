from typing import Optional, NamedTuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.credentials import AiProviderCredential
from app.security.crypto import crypto_service
from app.providers.llm.base import BaseLLMProvider
from app.providers.llm.gemini import GeminiProvider
from app.providers.llm.openai_provider import OpenAIProvider
from app.providers.llm.anthropic_provider import AnthropicProvider
from app.providers.llm.mock import MockDemoProvider

class ActiveLLMContext(NamedTuple):
    provider: BaseLLMProvider
    decrypted_api_key: str
    model_name: Optional[str]
    base_url: Optional[str]
    provider_type: str

class LLMProviderFactory:

    def __init__(self):
        self._providers = {
            "GEMINI": GeminiProvider(),
            "OPENAI": OpenAIProvider(),
            "ANTHROPIC": AnthropicProvider(),
            "MOCK_DEMO": MockDemoProvider()
        }
        self._mock = MockDemoProvider()

    def get_provider(self, provider_type: str) -> BaseLLMProvider:
        return self._providers.get(provider_type.upper(), self._mock)

    def resolve_active_context(self, user: User, db: Session) -> ActiveLLMContext:
        # Find active default credential for this user
        cred = db.query(AiProviderCredential).filter(
            AiProviderCredential.user_id == user.id,
            AiProviderCredential.is_active == True,
            AiProviderCredential.is_default == True
        ).first()

        if not cred:
            # Check any active credential
            cred = db.query(AiProviderCredential).filter(
                AiProviderCredential.user_id == user.id,
                AiProviderCredential.is_active == True
            ).first()

        if not cred or not cred.encrypted_api_key:
            return ActiveLLMContext(
                provider=self._mock,
                decrypted_api_key="mock_key",
                model_name="mock-demo",
                base_url=None,
                provider_type="MOCK_DEMO"
            )

        try:
            raw_key = crypto_service.decrypt(cred.encrypted_api_key)
            provider = self.get_provider(cred.provider_type)
            return ActiveLLMContext(
                provider=provider,
                decrypted_api_key=raw_key,
                model_name=cred.model_name,
                base_url=cred.base_url,
                provider_type=cred.provider_type
            )
        except Exception:
            return ActiveLLMContext(
                provider=self._mock,
                decrypted_api_key="mock_key",
                model_name="mock-demo",
                base_url=None,
                provider_type="MOCK_DEMO"
            )

llm_factory = LLMProviderFactory()
