# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.0.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via public GitHub issues.**

To report a security vulnerability, please open a [GitHub Security Advisory](../../security/advisories/new) or send an email to the maintainers with the subject line `[SECURITY] Beauty Style Pro – <brief description>`.

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact (data exposure, auth bypass, etc.)
- Suggested fix (if any)

You can expect an acknowledgement within **48 hours** and a status update within **7 days**.

## Security Practices

- All secrets and API keys must be stored in environment variables (never committed).
- Row Level Security (RLS) is enforced on all Supabase tables.
- Payments are handled exclusively via Stripe/PayPal — no card data is stored.
- GDPR compliance: user data export/deletion requests are supported.
- Dependencies are scanned weekly via `npm audit` and Dependabot.

## Responsible Disclosure

We follow a coordinated disclosure policy. Once a fix is deployed, we will publish a security advisory crediting the reporter (unless anonymity is requested).
