# Contributing to Beauty Style Pro

Thank you for your interest in contributing to Beauty Style Pro! 🎉

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

## How to Contribute

### Reporting Bugs

1. Check the [existing issues](https://github.com/mikimause93/beauty-style-pro/issues) to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include steps to reproduce, expected vs actual behaviour, and your environment details.

### Suggesting Features

1. Open an issue using the **Feature Request** template.
2. Describe the use case, motivation, and proposed implementation.

### Submitting Pull Requests

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make your changes following the coding standards below.
4. Add/update tests for your changes.
5. Run all checks locally:
   ```bash
   npm run lint
   npm run build
   npm test
   ```
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add AI preview share button
   fix: correct booking date validation
   docs: update API reference
   chore: bump vitest to v3
   ```
7. Push your branch and open a PR against `main`.

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Formatting:** Prettier (run `npm run format`)
- **Linting:** ESLint (run `npm run lint`)
- **Framework:** React 18 with functional components and hooks
- **State:** Zustand / React Query — no Redux
- **Styling:** Tailwind CSS — no inline styles
- **Testing:** Vitest for unit tests, Playwright for E2E

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by `commitlint`.

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation only          |
| `style`    | Formatting (no code change) |
| `refactor` | Code refactoring            |
| `test`     | Adding/updating tests       |
| `chore`    | Build, dependencies, CI     |
| `perf`     | Performance improvement     |
| `ci`       | CI/CD configuration         |

## Development Setup

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full environment setup.

Quick start:

```bash
git clone https://github.com/mikimause93/beauty-style-pro.git
cd beauty-style-pro
npm install
cp .env.example .env.local
# Fill in .env.local with your Supabase credentials
npm run dev
```

## Running Tests

```bash
npm test              # Unit tests
npm run test:ci       # Unit tests + coverage (CI mode)
npm run e2e           # End-to-end tests (requires npm run dev)
npm run coverage      # Coverage report
```

## Questions?

Open an issue using the **Question** template or start a [Discussion](https://github.com/mikimause93/beauty-style-pro/discussions).
