package com.aijobfinder.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CryptoServiceTest {

    private CryptoService cryptoService;

    @BeforeEach
    public void setup() {
        cryptoService = new CryptoService("TestMasterSecretKeyWith256BitsOfEntropy!");
    }

    @Test
    public void testEncryptAndDecryptRoundtrip() {
        String originalKey = "AIzaSyTestApiKey1234567890SecretKey";
        String encrypted = cryptoService.encrypt(originalKey);

        assertNotNull(encrypted);
        assertNotEquals(originalKey, encrypted);

        String decrypted = cryptoService.decrypt(encrypted);
        assertEquals(originalKey, decrypted);
    }

    @Test
    public void testMaskKey() {
        String originalKey = "AIzaSyTestApiKey12345678909F82";
        String masked = cryptoService.maskKey(originalKey);

        assertEquals("••••••••••••••••9F82", masked);
        assertFalse(masked.contains("AIzaSy"));
    }

    @Test
    public void testNullAndEmptyHandling() {
        assertNull(cryptoService.encrypt(null));
        assertNull(cryptoService.encrypt(""));
        assertNull(cryptoService.decrypt(null));
        assertNull(cryptoService.decrypt(""));
    }
}
