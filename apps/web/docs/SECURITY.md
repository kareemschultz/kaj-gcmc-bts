# GCMC-KAJ Platform Security Implementation

## Content Security Policy (CSP) Configuration

This document outlines the comprehensive security implementation for the GCMC-KAJ Business Tax Services platform, focusing on Content Security Policy (CSP) and related security measures.

### Overview

Our security implementation follows OWASP best practices and includes:

- **Dynamic CSP with nonce support** - Prevents XSS attacks
- **Comprehensive security headers** - Defense in depth approach
- **CSP violation reporting** - Real-time security monitoring
- **Environment-specific policies** - Different rules for dev/prod
- **Rate limiting** - Protection against abuse

### CSP Policy Structure

#### Core Directives

1. **default-src**: `'self'`
   - Restricts all resources to same-origin by default

2. **script-src**: `'self' 'nonce-{random}' [+ development allowances]`
   - Uses dynamic nonces for inline scripts
   - Allows `'unsafe-eval'` only in development for webpack HMR
   - Permits trusted CDNs with explicit allowlisting

3. **style-src**: `'self' 'nonce-{random}' 'unsafe-inline' https://fonts.googleapis.com`
   - Nonce support for secure inline styles
   - Temporary `'unsafe-inline'` for Tailwind CSS compatibility
   - Google Fonts integration

4. **connect-src**: Environment-specific API endpoints
   - **Development**: Allows localhost connections for tRPC and Better Auth
   - **Production**: Restricts to `*.gcmc-kaj.com` domains

#### Resource Directives

- **font-src**: `'self' https://fonts.gstatic.com data:`
- **img-src**: `'self' data: blob: https:`
- **frame-src**: `'self' blob:`
- **object-src**: `'none'` (Prevents Flash/Java applets)
- **media-src**: `'self' blob: data:`
- **worker-src**: `'self' blob:`

### Security Headers Implementation

#### Core Security Headers

```typescript
{
  "Content-Security-Policy": "...", // Dynamic CSP with nonce
  "X-Frame-Options": "SAMEORIGIN", // Clickjacking protection
  "X-Content-Type-Options": "nosniff", // MIME sniffing protection
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "...", // Feature policy
  "Strict-Transport-Security": "...", // HTTPS enforcement (prod only)
}
```

#### Cross-Origin Policies

- **COEP**: `unsafe-none` - Balanced security and functionality
- **COOP**: `same-origin-allow-popups` - Secure popup handling
- **CORP**: `cross-origin` - Resource sharing control

### Technology-Specific Configurations

#### Next.js 14+ Integration

- **Middleware-based CSP** - Dynamic nonce generation per request
- **App Router compatibility** - Server component nonce handling
- **Static generation support** - Edge runtime compatible

#### Tailwind CSS v4

- **Inline styles allowance** - `'unsafe-inline'` for CSS-in-JS
- **Font loading** - Google Fonts CSP configuration
- **Dark mode support** - Theme switching compatibility

#### tRPC API Communication

- **API endpoint allowlisting** - Specific localhost:3003 in development
- **Cookie credentials** - Secure session handling
- **CORS integration** - Aligned with Better Auth configuration

#### Better Auth Integration

- **Form action endpoints** - Auth-specific CSP allowances
- **Cookie security** - HttpOnly, Secure, SameSite configuration
- **CSRF protection** - Built-in token validation

#### Framer Motion & React Spring

- **Animation support** - Blob URLs for workers
- **Style injection** - Nonce-based inline styles where possible
- **GPU acceleration** - Safe resource loading

### CSP Violation Reporting

#### Reporting Endpoint

- **URL**: `/api/csp-report`
- **Rate limiting**: 10 reports/minute per IP
- **Structured logging**: JSON format with metadata
- **Severity detection**: High-risk violation identification

#### Monitored Violations

1. **Script injection attempts**
2. **External resource loading**
3. **Inline script/style violations**
4. **Frame/object embedding**
5. **Data URI abuse**

### Environment Configuration

#### Development

```typescript
// Relaxed policies for development workflow
"script-src": ["'self'", "'nonce-{nonce}'", "'unsafe-eval'"],
"connect-src": ["http://localhost:*", "ws://localhost:*"],
```

#### Production

```typescript
// Strict policies for production security
"script-src": ["'self'", "'nonce-{nonce}'", "https://cdn.vercel-insights.com"],
"connect-src": ["'self'", "https://*.gcmc-kaj.com", "wss://*.gcmc-kaj.com"],
"upgrade-insecure-requests": []
```

### Security Testing

#### Automated Tests

Run the security test suite:
```bash
npm run test:security
# or
node scripts/test-csp.js
```

#### Manual Verification

1. **Browser DevTools**: Check for CSP violations in console
2. **Network Panel**: Verify all resources load successfully
3. **Application Panel**: Confirm secure cookie attributes
4. **Security Panel**: Validate certificate and security state

### Security Checklist

#### Implementation Verification

- [ ] CSP headers present on all responses
- [ ] Nonce generation working correctly
- [ ] No CSP violations in browser console
- [ ] All API endpoints accessible
- [ ] Authentication flows working
- [ ] Tailwind styles rendering
- [ ] Animations functioning properly
- [ ] Third-party integrations compliant

#### Security Validation

- [ ] XSS injection attempts blocked
- [ ] External script loading prevented
- [ ] Frame embedding restricted
- [ ] Resource loading limited to allowed origins
- [ ] Cookie security attributes set
- [ ] HTTPS enforcement in production
- [ ] Violation reporting functional

### Troubleshooting

#### Common Issues

1. **Blocked API Calls**
   - Check `connect-src` includes your API endpoint
   - Verify CORS configuration matches CSP

2. **Missing Styles**
   - Ensure `style-src` includes necessary sources
   - Check for nonce attributes on inline styles

3. **Script Loading Failures**
   - Verify scripts have proper nonce attributes
   - Check `script-src` allowlist

4. **Font Loading Issues**
   - Confirm `font-src` includes font providers
   - Check `style-src` for stylesheet loading

#### Debug Tools

- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **Security Headers**: https://securityheaders.com/
- **Browser DevTools**: Console and Network panels
- **CSP Violation Reports**: Monitor `/api/csp-report` endpoint

### Future Enhancements

#### Planned Improvements

1. **Nonce-based Tailwind CSS** - Replace `'unsafe-inline'` with nonces
2. **Subresource Integrity (SRI)** - Hash verification for external scripts
3. **Trusted Types** - DOM XSS prevention
4. **CSP Level 3** - Advanced reporting and controls
5. **Security monitoring** - Real-time alerting system

#### Performance Considerations

- **CSP parsing overhead** - Minimize directive complexity
- **Nonce generation cost** - Optimize random number generation
- **Header size impact** - Balance security vs. payload size

### Contact & Support

For security concerns or questions:
- **Security Team**: security@gcmc-kaj.com
- **Development Team**: dev@gcmc-kaj.com
- **Emergency Security Issues**: Follow incident response procedures

---

**Last Updated**: November 2024
**Next Review**: December 2024