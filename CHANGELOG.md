# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Enterprise boilerplate: CI/CD workflows, lint, format, release automation
- Playwright E2E test scaffold
- Vitest unit test scaffold with coverage
- Husky pre-commit hooks with lint-staged
- Commitlint for conventional commits
- Semantic-release automation
- Comprehensive documentation (API, Deployment, Architecture, Database Schema, Troubleshooting)
- GitHub Issue templates (bug report, feature request, question)
- GitHub Pull Request template
- Security scan workflow (npm audit)
- AI Preview System (DALL-E 3 virtual try-on) — `supabase/migrations/005_ai_preview.sql`
- AI Preview edge function — `supabase/functions/generate-ai-preview/index.ts`

---

## [2.0.0] — 2026-03-22

### Added

- Neon UI theme with Orbitron font, glass cards, holographic gradients
- Stella AI voice assistant (wake words, GPT-4, TTS)
- Real-time notifications with `NotificationsContext`
- `safeStorage` utility with graceful localStorage fallback
- Central version constant in `src/lib/version.ts`
- Centralized error codes in `src/lib/errorCodes.ts`
- ChatbotWidget FAB with safe-area-aware positioning
- `.maybeSingle()` pattern throughout for safe Supabase queries
- manualChunks optimization in Vite config
- Forgot password flow in `AuthPage`

### Fixed

- PGRST116 errors from `.single()` on empty result sets
- Auth error messages now localized to Italian via `localizeAuthError()`

### Changed

- Upgraded to React 18.3 + Vite 5.0 + TypeScript 5.0
- Supabase JS to v2.98

---

## [1.0.0] — 2026-03-08

### Added

- Initial release
- Social feed, stories, live streaming
- Booking system
- Shop marketplace
- Academy LMS
- Creator economy
- Gamification (QR Coins, missions, leaderboard)
- Multi-language support (IT, EN, ES, FR, DE, AR)
- PWA + Capacitor mobile build
- Supabase backend (110+ tables, 300+ RLS policies)

[Unreleased]: https://github.com/mikimause93/beauty-style-pro/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/mikimause93/beauty-style-pro/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/mikimause93/beauty-style-pro/releases/tag/v1.0.0
