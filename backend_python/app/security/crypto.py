import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from app.config import settings

class CryptoService:
    """
    AES-256-GCM Credential Encryption & Decryption
    Fully binary-compatible with Java Spring Boot CryptoService:
    - PBKDF2WithHmacSHA256, 65,536 iterations, 256-bit key
    - 16-byte random salt
    - 12-byte random IV
    - Base64 payload: [salt (16B) + IV (12B) + ciphertext + tag (16B)]
    """

    def __init__(self, master_secret: str = None):
        self.master_secret = (master_secret or settings.MASTER_ENCRYPTION_KEY).encode("utf-8")

    def _derive_key(self, salt: bytes) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=65536,
        )
        return kdf.derive(self.master_secret)

    def encrypt(self, plain_text: str) -> str:
        if not plain_text or not plain_text.strip():
            return None
        
        salt = os.urandom(16)
        iv = os.urandom(12)
        key = self._derive_key(salt)

        aesgcm = AESGCM(key)
        cipher_text_and_tag = aesgcm.encrypt(iv, plain_text.encode("utf-8"), None)

        combined = salt + iv + cipher_text_and_tag
        return base64.b64encode(combined).decode("utf-8")

    def decrypt(self, cipher_text_b64: str) -> str:
        if not cipher_text_b64 or not cipher_text_b64.strip():
            return None
        
        try:
            combined = base64.b64decode(cipher_text_b64)
            if len(combined) < 28:
                return None
            
            salt = combined[:16]
            iv = combined[16:28]
            cipher_text_and_tag = combined[28:]

            key = self._derive_key(salt)
            aesgcm = AESGCM(key)
            decrypted_bytes = aesgcm.decrypt(iv, cipher_text_and_tag, None)
            return decrypted_bytes.decode("utf-8")
        except Exception as e:
            raise ValueError(f"Failed to decrypt credential: {str(e)}")

    def mask_key(self, raw_key: str) -> str:
        if not raw_key:
            return ""
        if len(raw_key) <= 4:
            return "••••"
        return "••••••••••••••••" + raw_key[-4:]

crypto_service = CryptoService()
