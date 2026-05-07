# Git Workflow

> How to work with Git at Eat Good Uganda.

## Branch Strategy

```
main ─────────────────────────────────────────────────────► production
  │
  ├── staging ────────────────────────────────────────► staging
  │     │
  │     ├── feature/description ───── PR
  │     ├── fix/description ────────── PR
  │     └── chore/description ──────── PR
  │
  └── (direct commits NEVER go to main)
```

- **main** — production-ready code, deploys to production
- **staging** — code ready for release, deploys to staging
- **feature/\*** — new features
- **fix/\*** — bug fixes
- **chore/\*** — maintenance, refactoring

## Working on a Feature

### 1. Start from staging

```bash
# Make sure staging is up to date
git checkout staging
git pull origin staging

# Create your feature branch
git checkout -b feature/my-new-feature
```

### 2. Work on your branch

```bash
# Make commits as you work
git add .
git commit -m "feat: add new feature component"
```

### 3. Push and create PR

```bash
# Push your branch
git push -u origin feature/my-new-feature

# Create PR via GitHub CLI
gh pr create --base staging --title "feat: my new feature"
```

### 4. Address review feedback

```bash
# Make changes
git add .
git commit -m "fix: address review comments"

# Force push to update PR
git push --force-with-lease
```

### 5. Merge after approval

```bash
# Merge via GitHub (preferred — runs CI checks)
# OR merge locally
git checkout staging
git merge feature/my-new-feature
git push origin staging
```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `docs`     | Documentation only                      |
| `style`    | Code style (formatting, semicolons)     |
| `refactor` | Code change that neither fixes nor adds |
| `test`     | Adding or updating tests                |
| `chore`    | Maintenance, dependencies, build        |

### Scope

Optional — what part of the project:

- `api` — backend
- `customer` — customer frontend
- `bakery` — bakery admin
- `admin` — super admin
- `db` — database
- `auth` — authentication

### Examples

```
feat(api): add customer password reset endpoint
fix(customer): correct cart total calculation
docs: update API documentation
refactor(auth): simplify token refresh logic
test(bakery): add order status transition tests
chore: upgrade dependencies
```

### Rules

- Use imperative mood: "add" not "added" or "adds"
- Keep subject line under 72 characters
- Reference issues in footer: `Closes #123`

## Pull Request Guidelines

### PR Requirements

Before requesting review:

- [ ] All checks pass (lint, typecheck, tests)
- [ ] PR description explains what and why
- [ ] Screenshots for UI changes
- [ ] Link to related issues

### PR Review

- **Minimum 1 approval** required
- **Owner must review** their own PR? No
- **Changes requested?** Address and re-request

### Merging

- **Squash merge** preferred — keeps `main` linear
- **Merge commit** acceptable for large features with multiple logical commits
- **Rebase** only for small, personal branches

## Handling Conflicts

### With staging

```bash
# Update staging
git fetch origin
git checkout staging
git pull origin staging

# Rebase your branch
git checkout feature/my-feature
git rebase staging

# Fix conflicts if any, then
git push --force-with-lease
```

### Using GitHub UI

1. Click "Resolve conflicts" on the PR
2. Manually resolve conflicts in the browser editor
3. Mark as resolved
4. Click "Merge"

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** — breaking changes
- **MINOR** — new features (backward compatible)
- **PATCH** — bug fixes

Version stored in `package.json` at root.

### Release Steps

1. **Merge to staging** — all tests pass
2. **QA on staging** — verify in staging environment
3. **Merge staging to main** — via PR
4. **Tag the release**:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```
5. **Deploy to production** — automatic via Vercel/Render

### Release Notes

Auto-generate from commit history:

```bash
git log --oneline staging..main
```

## Hotfix Production

For critical production bugs:

```bash
# Create branch from main
git checkout main
git pull main
git checkout -b fix/critical-bug

# Fix and commit
git commit -m "fix: critical bug fix"

# PR directly to main (bypass staging)
gh pr create --base main --title "fix: critical bug"
```

After merge:

- Tag the fix: `git tag -a v1.0.1 -m "Hotfix v1.0.1"`
- Backport to staging if needed

## Code Review Checklist

Reviewer checks:

- [ ] Code follows `instructions/02-code-style.md`
- [ ] Multi-tenancy isolation maintained
- [ ] No secrets in code
- [ ] Tests included
- [ ] Types correct
- [ ] Error handling present

---

> **Golden Rule:** Never commit directly to `main` or `staging`.
