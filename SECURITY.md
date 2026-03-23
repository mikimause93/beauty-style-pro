# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.0.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via GitHub Issues.**

To report a security vulnerability, please:

1. **Email:** Send details to the repository maintainer via GitHub's private security advisory feature.
2. **GitHub Security Advisory:** Go to [Security → Advisories](https://github.com/mikimause93/beauty-style-pro/security/advisories/new) and click "Report a vulnerability".

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We aim to acknowledge reports within **48 hours** and provide a fix within **7 days** for critical issues.

## Security Features

- **Row Level Security (RLS):** 300+ policies across 110+ database tables
- **JWT Authentication:** Supabase Auth with refresh token rotation
- **HTTPS:** TLS 1.3 enforced via Cloudflare + Vercel
- **Secrets Management:** All secrets in Supabase Vault (never in code)
- **Rate Limiting:** Per-user rate limits in `rate_limits` table + Cloudflare
- **DDoS Protection:** Cloudflare WAF
- **Content Moderation:** AI-powered NSFW detection on media uploads
- **GDPR Compliance:** Consent tracking, data export, and deletion requests
- **PCI DSS:** Payments handled entirely by Stripe (we never store card data)

## Security Headers

The following headers are set via `vercel.json`:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`

## Disclosure Policy

We follow responsible disclosure. After a fix is released, we will publicly disclose the vulnerability details in the CHANGELOG and credit the reporter (unless they prefer to remain anonymous).
