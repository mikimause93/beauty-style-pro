# Changelog

All notable changes to Beauty Style Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enterprise boilerplate: CI/CD workflows, lint, tests, docs, release automation
- `pasted.txt` canonical spec for Beauty Style Pro 4.0 ULTRA ENTERPRISE
- GitHub issue templates and pull request template
- Playwright E2E test scaffold
- Husky pre-commit hooks with lint-staged
- Semantic-release configuration
- Comprehensive documentation in `docs/`
- Helper scripts in `scripts/`
- Supabase AI Preview migration (`005_ai_preview.sql`)
- Edge function `generate-ai-preview`

## [2.0.0] - 2026-03-22

### Added

- Neon LED v2.0 design system (Orbitron font, holographic gradients)
- Voice commands: `torna indietro`, `scorri su/giù`, `cerca <query>`, theme toggle
- `safeStorage` utility with localStorage fallback to in-memory Map
- Centralized error code system (`localizeAuthError`, `localizeDbError`)
- NotificationsContext + NotificationToast with CustomEvent bus
- Reset password flow in AuthPage
- `APP_VERSION` constant in `src/lib/version.ts`

### Fixed

- Replace `.single()` with `.maybeSingle()` to avoid PGRST116 errors
- Auth error messages localized to Italian

## [1.0.0] - 2026-03-08

### Added

- Initial release: React + Vite + TypeScript + Supabase
- Social feed, bookings, shop, academy, creator economy
- Stella AI voice assistant (GPT-4 + Whisper)
- Real-time chat and notifications
- Mobile app via Capacitor (iOS/Android)
- Gamification: QR Coins, missions, leaderboard
