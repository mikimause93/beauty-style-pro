# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enterprise boilerplate: CI pipelines, testing scaffold, linting, docs, release automation
- Playwright E2E testing configuration
- Vitest unit test scaffold
- GitHub Actions: security-scan workflow
- Issue templates: bug report, feature request, question
- Pull request template with checklist
- Documentation: API, Deployment, Architecture, Database Schema, Troubleshooting
- Scripts: setup.sh, migrate.sh, deploy.sh
- Husky pre-commit hooks with lint-staged
- Commitlint for conventional commit enforcement
- Semantic-release configuration

## [3.0.0] - 2026-03-23

### Added

- Full enterprise feature set: Chat System, Voice & Video Calls, Geolocation (GDPR), Push Notifications
- Shop Marketplace (Etsy-style) with commission tiers
- Academy LMS with HLS video, certificates, job placement
- Stella AI Voice Assistant (GPT-4, wake words, scheduled actions)
- Creator Economy system (memberships, tips, brand partnerships)
- Admin Panel with moderation queue and feature flags
- Gamification: QR Coins, missions, spin wheel, leaderboard
- Multi-language support: IT, EN, ES, FR, DE, AR (RTL)
- PWA + Capacitor native apps (iOS/Android)
- 110+ database tables with 300+ RLS policies
- 25+ Supabase Edge Functions

### Changed

- Upgraded to React 18.3, Vite 5.0, TypeScript 5.0
- Upgraded to Supabase JS v2, PostgreSQL 15
- Migrated to Tailwind CSS 3.4 + Framer Motion

## [2.0.0] - 2025-01-15

### Added

- Neon/LED dark UI design system (Orbitron font, glass cards, holographic gradients)
- Stella AI voice assistant with wake word detection
- Real-time chat with voice messages and translation
- Dark/Light theme with localStorage persistence
- Phone OTP authentication (WhatsApp-style)
- Multi-role system: client, professional, business, creator
- Social feed with stories and live streaming
- Booking system with calendar picker

### Changed

- Migrated from plain CSS to Tailwind CSS
- Replaced class components with React hooks

## [1.0.0] - 2024-06-01

### Added

- Initial release
- Basic booking system
- User authentication
- Professional profiles

[Unreleased]: https://github.com/mikimause93/beauty-style-pro/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/mikimause93/beauty-style-pro/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/mikimause93/beauty-style-pro/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/mikimause93/beauty-style-pro/releases/tag/v1.0.0
