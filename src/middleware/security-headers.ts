/**
 * Security Headers Utility
 * Injects client-side security meta tags and documents recommended server-side headers.
 * For full CSP enforcement, configure these in vercel.json or your hosting platform.
 */

/**
 * Injects security-related meta tags into <head> at runtime.
 * This supplements (but does not replace) server-side headers.
 */
export const injectSecurityMeta = (): void => {
    const head = document.head;

    // Referrer Policy
    if (!document.querySelector('meta[name="referrer"]')) {
        const referrer = document.createElement('meta');
        referrer.name = 'referrer';
        referrer.content = 'strict-origin-when-cross-origin';
        head.appendChild(referrer);
    }

    // X-Content-Type-Options equivalent hint
    if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
        const xcto = document.createElement('meta');
        xcto.httpEquiv = 'X-Content-Type-Options';
        xcto.content = 'nosniff';
        head.appendChild(xcto);
    }

    console.info('[SECURITY] Client-side security meta tags injected.');
};

/**
 * Recommended Vercel / server-side headers.
 * These should match the vercel.json headers configuration.
 */
export const RECOMMENDED_SECURITY_HEADERS = {
    'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' https://fonts.gstatic.com;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Validates that the current page is served over HTTPS in production.
 */
export const enforceHttps = (): void => {
    if (
        import.meta.env.PROD &&
        window.location.protocol === 'http:' &&
        !window.location.hostname.includes('localhost')
    ) {
        console.warn('[SECURITY] Redirecting to HTTPS...');
        window.location.replace(`https://${window.location.host}${window.location.pathname}`);
    }
};
