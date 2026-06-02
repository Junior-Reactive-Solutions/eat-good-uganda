# Contributing to Eat Good Uganda

Thank you for your interest in contributing to Eat Good Uganda! This guide will help you get started.

## 🎯 Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on ideas and code, not individuals
- Help others learn and improve

## 🚀 Getting Started

### 1. Fork the Repository
```bash
# Click "Fork" on GitHub
# Then clone your fork locally
git clone https://github.com/YOUR_USERNAME/eat-good-uganda.git
cd eat-good-uganda

# Add upstream remote
git remote add upstream https://github.com/Junior-Reactive-Solutions/eat-good-uganda.git
```

### 2. Install Dependencies
```bash
# Install pnpm if needed
npm install -g pnpm

# Install project dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your local database
```

### 3. Create a Feature Branch
```bash
# Update from upstream
git fetch upstream
git rebase upstream/master

# Create your branch (use descriptive names)
git checkout -b feature/add-new-feature
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/improve-readme
```

## 🔍 Finding Work

### For First-Time Contributors
- Look for issues with labels: `good-first-issue`, `junior-friendly`
- Start with documentation fixes (low risk, high impact)
- Ask questions in [Discussions](../../discussions) if unclear

### For Feature Development
1. Check [open issues](../../issues?q=is%3Aopen+is%3Aissue+label%3Atype%2Ffeature)
2. Look for issues with `status/ready` label
3. Create an issue if you have a new idea
4. Wait for feedback before starting implementation

### For Bug Fixes
1. Check [open bugs](../../issues?q=is%3Aopen+is%3Aissue+label%3Atype%2Fbug)
2. Look for `status/ready` or `priority/high` labels
3. Create a bug report if you find a new issue

## 📝 Development Process

### Step 1: Create Your Feature Branch
```bash
# Create a new branch from main
git checkout -b feature/your-feature-name

# Make your changes
# ...
```

### Step 2: Follow Code Standards

#### TypeScript & Code Style
```typescript
// ✅ DO: Use TypeScript strict mode
interface User {
  id: string;
  email: string;
  name: string;
}

function createUser(data: User): Promise<User> {
  // Implement
}

// ❌ DON'T: Avoid `any`
function createUser(data: any): any {
  // No type safety
}
```

#### Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `user-service.ts`)
- **Types:** `PascalCase` (e.g., `User`, `UserService`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Variables:** `camelCase` (e.g., `userName`)
- **Components:** `PascalCase` (e.g., `UserCard.tsx`)

#### Imports & Organization
```typescript
// Group imports: built-in, external, internal
import { useState } from 'react';

import axios from 'axios';

import { UserService } from '../services/user-service';
import type { User } from '../types';
```

### Step 3: Write Tests (TDD)

**Important:** We follow Test-Driven Development (TDD):
1. Write the test first (it should fail)
2. Write the minimal code to make it pass
3. Refactor for clarity

```typescript
// Example: user.test.ts (write this FIRST)
describe('createUser', () => {
  it('should create a user with valid data', async () => {
    const user = await createUser({
      id: '123',
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(user.id).toBe('123');
    expect(user.email).toBe('test@example.com');
  });

  it('should reject invalid email', async () => {
    expect(async () => {
      await createUser({
        id: '123',
        email: 'invalid',
        name: 'Test'
      });
    }).rejects.toThrow();
  });
});

// Then implement: user-service.ts
export async function createUser(data: User): Promise<User> {
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }
  // ... implementation
}
```

### Step 4: Commit Changes

```bash
# Stage your changes
git add .

# Commit with clear message
# Format: type(scope): description
git commit -m "feat(users): add user creation endpoint"

# Examples:
git commit -m "fix(auth): correct token validation logic"
git commit -m "docs(readme): update installation steps"
git commit -m "test(orders): add payment processing tests"
git commit -m "refactor(cart): simplify item calculation"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests or test coverage
- `refactor:` Code cleanup (no behavior change)
- `perf:` Performance improvement
- `chore:` Maintenance (deps, CI, etc.)

### Step 5: Run Checks Locally

**Before pushing, verify everything passes:**

```bash
# Run tests
pnpm -w test

# Check types
pnpm -w typecheck

# Run linter
pnpm -w lint

# Optional: Check coverage
pnpm -w test -- --coverage
```

**Fix any issues:**
```bash
# Auto-fix lint issues
pnpm -w lint -- --fix

# Re-run tests
pnpm -w test
```

### Step 6: Push & Create PR

```bash
# Push your branch
git push origin feature/your-feature-name

# GitHub will show a "Create Pull Request" link
# OR go to https://github.com/Junior-Reactive-Solutions/eat-good-uganda/pulls
```

### Step 7: PR Checklist

**Before submitting your PR:**
- [ ] Branch is up-to-date with `upstream/master`
- [ ] All tests pass (`pnpm -w test`)
- [ ] TypeScript strict mode passes (`pnpm -w typecheck`)
- [ ] ESLint passes (`pnpm -w lint`)
- [ ] Commits follow the format (see above)
- [ ] PR description is clear and links issues
- [ ] Screenshots attached (if UI change)
- [ ] No secrets or credentials in code

**In your PR description:**
```markdown
## What
Brief description of what this PR does.

## Why
The motivation and context.

## How
Approach taken, non-obvious choices highlighted.

## Testing
How to test the changes manually.

Fixes #123
Relates to #456
```

### Step 8: Code Review

**Respond to feedback promptly:**
- ✅ Approve suggestions when appropriate
- 🤔 Ask for clarification if confused
- 📝 Make requested changes and commit
- 💬 Resolve conversations once fixed

**After making changes:**
```bash
# Make your fixes
git add .
git commit -m "fix: address review feedback"
git push
# Tests will re-run automatically
```

### Step 9: Merge

Once approved and all checks pass:
- ✅ Your PR is ready to merge
- 🔄 Merge button will appear on GitHub
- 🎉 Your code is now in the main branch!

## 🔄 Updating Your PR

If the main branch has updates while you're working:

```bash
# Update from upstream
git fetch upstream

# Rebase your branch
git rebase upstream/master

# If there are conflicts, resolve them then:
git add .
git rebase --continue

# Force push (only on your branch!)
git push --force-with-lease origin feature/your-feature-name
```

## 🐛 Reporting Bugs

If you find a bug, please:

1. **Check if it's already reported:** [Search issues](../../issues)
2. **Create a bug report** using [the template](.github/ISSUE_TEMPLATE/bug_report.md)
3. **Include:**
   - What you did (steps to reproduce)
   - What you expected to happen
   - What actually happened
   - Your environment (OS, Node version, etc.)
   - Screenshots/logs if helpful

## 🎁 Suggesting Features

To suggest a new feature:

1. **Check existing requests:** [Search discussions](../../discussions)
2. **Create a discussion** with your idea
3. **Describe:**
   - The feature and what problem it solves
   - How users would benefit
   - Any alternative approaches
4. **Wait for feedback** before starting implementation

## 📚 Documentation

**Improve documentation by:**
- Fixing typos or unclear explanations
- Adding missing examples
- Clarifying complex concepts
- Adding new guides

**Documentation files:**
- `README.md` — Project overview
- `CONTRIBUTING.md` — This file
- `docs/*.md` — Detailed specifications
- `instructions/*.md` — Implementation rules

## 🔐 Security

**Help keep the project secure:**
- ❌ Never commit secrets (API keys, tokens, passwords)
- ❌ Don't hardcode credentials
- ✅ Use environment variables (`.env`)
- ✅ Validate all user input
- ✅ Filter by `bakery_id` for multi-tenant queries

**If you find a security issue:**
1. **Don't create a public issue**
2. **Email:** security@eatgooduganda.ug (or open a private discussion)
3. **Include:** Details about the vulnerability and impact
4. **Wait:** For acknowledgment before disclosing publicly

## 📞 Getting Help

- **Questions:** [Start a Discussion](../../discussions)
- **Issues:** [Create an Issue](../../issues)
- **Chat:** Check out our Discussions tab
- **Code:** Read `docs/` for architecture & design decisions

## ✨ Recognition

We recognize all contributors! When your PR is merged:
- ✅ Your name appears in git history
- 🏆 You'll be mentioned in release notes (major contributions)
- 🎯 Your profile is linked in the project

## 📜 License

By contributing to Eat Good Uganda, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## 🙏 Thank You!

Thank you for contributing to Eat Good Uganda. We're excited to have you as part of our community, whether you're fixing bugs, adding features, improving documentation, or spreading the word!

---

**Happy coding! 🚀**
