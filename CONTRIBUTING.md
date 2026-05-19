# Contributing to LeetCast

First off, thank you for considering contributing to LeetCast! It's people like you that make LeetCast such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots or animated GIFs if helpful**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the desired behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the TypeScript style guidelines
- Include thoughtfully-worded, well-structured tests
- Document new code based on the Documentation Style Guide
- End all files with a newline

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0 (we use pnpm workspaces, NOT npm)
- Git

### Setup Steps

1. Fork and clone the repository

   ```bash
   git clone https://github.com/your-username/leetcast.git
   cd leetcast
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example apps/web/.env
   cp .env.example apps/worker/.env
   # Edit .env with your API keys
   ```

4. Build shared packages & run the development server

   ```bash
   pnpm --filter @leetcast/core build
   pnpm --filter @leetcast/database build
   pnpm --filter @leetcast/web dev
   ```

### Development Workflow

1. Create a new branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests

   ```bash
   pnpm test
   ```

4. Run linting

   ```bash
   pnpm lint
   ```

5. Run type checking

   ```bash
   pnpm typecheck
   ```

6. Commit your changes

   ```bash
   git commit -m "feat: your feature description"
   ```

7. Push to your fork

   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request

## Coding Standards

### TypeScript Style Guide

- Use TypeScript for all new code
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Follow the existing code style

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Example:

```
feat: add support for custom voice selection

- Add voice ID parameter to audio service
- Update CLI to allow voice selection
- Add tests for voice selection feature
```

### Testing

- Write unit tests for all new functionality
- Ensure all tests pass before submitting a PR
- Aim for at least 80% code coverage for new code
- Use descriptive test names

### Documentation

- Update the README.md if you change functionality
- Update API documentation for public APIs
- Add JSDoc comments to new functions and classes
- Keep comments up-to-date with code changes

## Project Structure

```
leetcast/
├── .github/              # GitHub specific files
│   ├── workflows/        # CI/CD workflows
│   └── dependabot.yml    # Dependency updates config
├── .husky/               # Git hooks
├── .vscode/              # VS Code settings
├── dist/                 # Compiled JavaScript
├── downloads/            # Downloaded audio files
├── src/                  # Source code
│   ├── __tests__/        # Test files
│   ├── scripts/          # Utility scripts
│   ├── services/         # Core services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── .editorconfig         # Editor configuration
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── .prettierrc           # Prettier configuration
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # This file
├── jest.config.js        # Jest configuration
├── LICENSE               # MIT License
├── package.json          # Project metadata
├── README.md             # Project documentation
├── SECURITY.md           # Security policy
└── tsconfig.json         # TypeScript configuration
```

## Getting Help

- Open a GitHub issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in all interactions

## Recognition

Contributors will be recognized in our README and release notes. Thank you for your contributions!

---

Again, thank you for your interest in contributing to LeetCast! 🎉
