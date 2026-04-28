# 08 — Commit and PR Rules

## Commit messages

Conventional Commits format:

```
<type>(<scope>): <short description>

<optional body>

<optional footer>
```

### Types

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — formatting, no code change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `test` — adding or fixing tests
- `build` — build system or dependency changes
- `ci` — CI pipeline changes
- `chore` — maintenance, non-src changes
- `revert` — revert a previous commit

### Scope

Usually the workspace name or feature area. Examples: `api`, `customer`, `bakery-admin`, `super-admin`, `db`, `shared`, `auth`, `payments`, `orders`.

### Short description

- Imperative mood: "add endpoint", not "added endpoint" or "adds endpoint".
- Lowercase first letter.
- No trailing period.
- ≤ 72 characters.

### Body (optional)

- Explain **why**, not what. The code diff shows what.
- Wrap at 72 characters.
- Blank line between subject and body.

### Footer (optional)

- `BREAKING CHANGE:` for any breaking change.
- `Closes #123` / `Refs #456` to link issues.

## Examples

```
feat(payments): add MTN MoMo collection flow

Implements POST /v1/customer/orders/:id/pay for method=mtn_momo.
Calls the collection requesttopay endpoint with the bakery's
per-bakery credentials, returns a poll URL for the customer.

Refs #42
```

```
fix(bakery): tenant isolation check on order messages

The POST /v1/bakery/orders/:orderId/messages endpoint was looking up
the order without filtering by bakery_id, relying on RLS alone.
RLS works, but application-layer belt-and-braces is policy. Adds the
explicit filter and a cross-tenant isolation test that would have
caught the gap.
```

```
docs(architecture): clarify path-based URL scheme

Updates docs/01-ARCHITECTURE.md and README.md to make it explicit
that subdomains are reserved for admin surfaces. Path-based customer
storefront is the deliberate v1 choice.
```

## One commit, one change

Each commit should be independently valid:
- Tests pass.
- Type check passes.
- Lint passes.
- No "fixup" commits in the final history (squash or rebase them before merging).

## Branch naming

```
<type>/<short-kebab-description>
```

Examples:
- `feat/momo-collection-flow`
- `fix/tenant-filter-on-order-messages`
- `docs/add-payments-doc`
- `chore/bump-react-router`

## Pull requests

### Title

Same format as commit messages. The PR title becomes the squash-merge commit message.

### Description

Required sections:

```markdown
## What

One-paragraph summary of what this PR does.

## Why

The motivation. Link the issue if there is one.

## How

Brief description of the approach. Highlight non-obvious choices.

## Checklist

- [ ] Lint passes (`pnpm -w lint`)
- [ ] Typecheck passes (`pnpm -w typecheck`)
- [ ] Tests pass (`pnpm -w test`)
- [ ] Cross-tenant isolation tests added (if tenant-scoped)
- [ ] docs/ updated (if architectural)
- [ ] docs/17-DECISIONS_LOG.md updated (if a design decision was made)
- [ ] `.env.example` updated (if new env vars added)
- [ ] No secrets committed
- [ ] Screenshots attached (if UI change)

## How to test

Step-by-step manual test procedure.
```

`.github/PULL_REQUEST_TEMPLATE.md` in this repo contains this template.

### Review

- Every PR needs at least one approval from someone other than the author.
- The CI pipeline (`lint`, `typecheck`, `test-unit`, `test-api`, `test-e2e`) must pass.
- PRs that touch tenant-scoped data must be reviewed by a maintainer.

### Merge strategy

- **Squash and merge.** One PR = one commit in history.
- The squash commit message is the PR title + description.
- No merge commits on `main` or `staging` — clean linear history.

### Large PRs

- Target: ≤ 500 lines of diff (excluding lockfile and generated code).
- If a change must be larger, split into stacked PRs.
- A 2000-line PR is a red flag; the author is asked to split before review.

## Protected branches

- `main` and `staging` are protected.
- No direct pushes.
- Require status checks + review.
- Require linear history.
- Administrators also obey these rules.

## Reverts

- To revert, use `git revert` on the squash-merge commit.
- Open a PR titled `revert(scope): <original title>`.
- Reference the original PR in the description with the reason for reverting.
- Merge without the usual review delay if revert is for an active incident; post-hoc review allowed.

## Release notes

At every `main` merge, the bot appends a line to `CHANGELOG.md` under a rolling "Unreleased" section. On cutting a release, rename "Unreleased" to the version and date.
