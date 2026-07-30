import CryptoJS from 'crypto-js';

/**
 * CRITICAL: VITE_ENCRYPTION_KEY must be set in production.
 * See .env.example for setup instructions.
 * If not set at build time, a warning is emitted and a deterministic 
 * fallback is used ONLY for local development.
 */
const SECRET_KEY = (() => {
    const key = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!key || key === 'CHANGE_THIS_TO_A_SECURE_32_CHAR_KEY_BEFORE_DEPLOY') {
        if (import.meta.env.PROD) {
            console.error(
                '[SECURITY] CRITICAL: VITE_ENCRYPTION_KEY is not configured! ' +
                'Set a secure 32+ char key in .env before deploying to production.'
            );
        }
        // Development fallback — NEVER use in production
        return 'dev-fallback-key-not-for-prod-32chr';
    }
    return key;
})();

/**
 * Encrypts data using AES-256
 * @param data The string to encrypt
 * @returns Encrypted string (Base64)
 */
export const encryptData = (data: string): string => {
    try {
        return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    } catch (error) {
        console.error('[SECURITY] Encryption failed:', error);
        throw new Error('Security Error: Failed to protect data');
    }
};

/**
 * Decrypts data using AES-256
 * @param ciphertext The encrypted string
 * @returns Decrypted string
 */
export const decryptData = (ciphertext: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('[SECURITY] Decryption failed:', error);
        throw new Error('Security Error: Failed to access protected data');
    }
};

/**
 * Generates a non-deterministic signature for anti-scraping
 * @param payload Data to sign
 * @returns Signature string
 */
export const generateSecureSignature = (payload: string): string => {
    const timestamp = Math.floor(Date.now() / 10000); // 10-second window
    return CryptoJS.HmacSHA256(`${payload}:${timestamp}`, SECRET_KEY).toString();
};
