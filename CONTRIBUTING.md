# Contributing to Beauty Style Pro

Thank you for your interest in contributing! This guide explains how to get started.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

1. **Fork & clone** the repository.
2. **Install dependencies**: `npm install`
3. **Copy environment file**: `cp .env.example .env.local` and fill in your values.
4. **Start local Supabase**: `npx supabase start`
5. **Start dev server**: `npm run dev`

## Branch Strategy

- `main` — production-ready code; protected branch
- `develop` — integration branch
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance tasks
- `docs/<name>` — documentation updates

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:

```
feat(booking): add stripe payment intent creation
fix(auth): handle expired JWT gracefully
docs(api): document booking endpoint
```

## Pull Request Process

1. Create a branch from `main` (or `develop`).
2. Make your changes with atomic commits.
3. Run `npm run lint && npm run build && npm test` locally.
4. Open a PR with a clear description, referencing any related issues.
5. Ensure all CI checks pass.
6. Request a review from a maintainer.

## Coding Standards

- **TypeScript**: strict mode; avoid `any` when possible.
- **Formatting**: Prettier (run `npm run format`).
- **Linting**: ESLint (run `npm run lint`).
- **Tests**: Vitest for unit tests; Playwright for E2E. Aim for ≥80% coverage.
- **Accessibility**: Follow WCAG 2.1 AA guidelines.
- **Security**: Never commit secrets; use `.env.local` or GitHub Secrets.

## Reporting Bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## Requesting Features

Please use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
