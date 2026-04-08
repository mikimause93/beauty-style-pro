# Contributing to Beauty Style Pro

Thank you for your interest in contributing! Please read these guidelines before opening issues or pull requests.

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## How to Contribute

### Reporting Bugs

1. Search existing [issues](../../issues) first.
2. Open a new issue using the **Bug Report** template.
3. Include steps to reproduce, expected vs. actual behaviour, and your environment (OS, Node version, browser).

### Requesting Features

1. Open a new issue using the **Feature Request** template.
2. Describe the problem your feature would solve.
3. Discuss before implementing large changes.

### Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   ```
   feat: add booking reminder notifications
   fix: resolve stripe webhook 400 error
   chore: update dependencies
   docs: improve setup guide
   ```
3. Ensure all checks pass locally:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. Open a PR against `main` using the PR template. Link any related issues.
5. At least one approving review is required before merging.

## Development Setup

See the [README](./README.md) and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for full setup instructions.

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                       |
| ---------- | --------------------------------- |
| `feat`     | New feature                       |
| `fix`      | Bug fix                           |
| `docs`     | Documentation changes             |
| `style`    | Formatting, no code logic change  |
| `refactor` | Code change without bug/feature   |
| `test`     | Adding or updating tests          |
| `chore`    | Build process, dependency updates |
| `perf`     | Performance improvements          |
| `ci`       | CI/CD configuration changes       |

Commits are enforced via `commitlint`. Breaking changes must include `BREAKING CHANGE:` in the commit footer.

## Code Style

- **TypeScript** — strict types; avoid `any`.
- **Prettier** — format code with `npm run format`.
- **ESLint** — lint with `npm run lint`.
- React components use functional style with hooks.
- All UI changes should be tested in both light and dark modes.

## Testing

- Unit tests: `npm run test`
- Coverage report: `npm run coverage`
- E2E tests: `npm run e2e`

All new features should include appropriate unit tests. Critical user flows should be covered by E2E tests.

## Branch Strategy

| Branch    | Purpose               |
| --------- | --------------------- |
| `main`    | Production-ready code |
| `feat/*`  | New features          |
| `fix/*`   | Bug fixes             |
| `chore/*` | Maintenance tasks     |
| `docs/*`  | Documentation updates |

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
