package com.aijobfinder.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

@Service
public class CryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    private static final int SALT_LENGTH_BYTE = 16;
    private static final int ITERATION_COUNT = 65536;
    private static final int KEY_LENGTH_BIT = 256;

    private final String masterSecret;

    public CryptoService(@Value("${app.security.encryption-key}") String masterSecret) {
        this.masterSecret = masterSecret;
    }

    /**
     * Encrypts plaintext API key using AES-256-GCM with a random salt & IV.
     * Returns Base64-encoded [salt (16b) + IV (12b) + ciphertext + tag].
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.trim().isEmpty()) {
            return null;
        }
        try {
            byte[] salt = new byte[SALT_LENGTH_BYTE];
            byte[] iv = new byte[IV_LENGTH_BYTE];
            SecureRandom random = new SecureRandom();
            random.nextBytes(salt);
            random.nextBytes(iv);

            SecretKey secretKey = deriveKey(masterSecret, salt);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(salt.length + iv.length + cipherText.length);
            byteBuffer.put(salt);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption error: Unable to securely encrypt credential", e);
        }
    }

    /**
     * Decrypts encrypted Base64 string back to plaintext credential.
     */
    public String decrypt(String cipherTextBase64) {
        if (cipherTextBase64 == null || cipherTextBase64.trim().isEmpty()) {
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(cipherTextBase64);
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);

            byte[] salt = new byte[SALT_LENGTH_BYTE];
            byteBuffer.get(salt);

            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            SecretKey secretKey = deriveKey(masterSecret, salt);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption error: Invalid or corrupted encrypted credential", e);
        }
    }

    /**
     * Masks an API key for safe frontend display (e.g., ••••••••••••••••9F82).
     */
    public String maskKey(String plainTextKey) {
        if (plainTextKey == null || plainTextKey.trim().isEmpty()) {
            return "";
        }
        int len = plainTextKey.length();
        if (len <= 4) {
            return "••••";
        }
        String lastFour = plainTextKey.substring(len - 4);
        return "••••••••••••••••" + lastFour;
    }

    private SecretKey deriveKey(String password, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATION_COUNT, KEY_LENGTH_BIT);
        SecretKey tmp = factory.generateSecret(spec);
        return new SecretKeySpec(tmp.getEncoded(), "AES");
    }
}
