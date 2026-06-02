# Branch Protection Rules

This document describes the recommended branch protection settings to enforce code quality and team processes.

## Why Branch Protection?

Branch protection rules prevent:
- Merging code that doesn't pass tests
- Accidental pushes to production branches
- Bypassing code review requirements
- Force-pushing breaking changes
- Merging with unresolved conversations

## Recommended Settings for `main` / `master` Branch

### 1. Require Status Checks to Pass Before Merging ✅

**Enforce:** YES

**Required status checks:**
- ✅ `test-and-coverage / test` — All tests must pass
- ✅ `test-and-coverage / typecheck` — TypeScript strict mode
- ✅ `test-and-coverage / lint` — ESLint
- ✅ `security / security` — Security scanning

**Dismiss stale PR approvals:** YES
**Require branches to be up to date before merging:** YES

### 2. Require Code Review Before Merging ✅

**Require pull request reviews before merging:** YES
**Number of approvals required:** 1 (adjustable to 2 for production)
**Dismiss stale pull request approvals when new commits are pushed:** YES
**Require review from Code Owners:** YES

### 3. Code Owners

File: `.github/CODEOWNERS`

Each PR to protected areas must be reviewed by team owner.

Current setup:
```
* @Junior-Reactive-Solutions/dev-team
apps/api/ @Junior-Reactive-Solutions/dev-team
packages/db/ @Junior-Reactive-Solutions/dev-team
# ... (see CODEOWNERS for full list)
```

### 4. Require Conversation Resolution ✅

**Require conversation resolution before merging:** YES

Ensures all review comments are resolved before merge.

### 5. Require Passing Checks for Up-To-Date Branches ✅

**Require branches to be up to date before merging:** YES

Prevents merging stale branches that might have conflicts.

### 6. Require Signed Commits ⚠️ (Optional)

**Require signed commits:** NO (optional)

- Enforces GPG signing on all commits
- Good for extra security, but requires developer setup
- Can be added later if needed

### 7. Restrict Pushes to Matching Branches ⚠️ (Optional)

**Restrict who can push to matching branches:** NO (optional)

- If enabled, only selected users/teams can directly push
- Recommended: NO (all PRs go through review)

### 8. Require Deployment to Environments ⚠️ (For staging/production)

**Require deployments to succeed before merging:** NO (future)

- For staging/production branches only
- Ensures deployment to staging succeeds before production

---

## How to Apply These Settings via GitHub CLI

Use GitHub CLI to apply these settings:

```bash
# Install GitHub CLI
brew install gh  # macOS
# or see https://github.com/cli/cli#installation

# Authenticate
gh auth login

# Apply branch protection (example)
gh api repos/Junior-Reactive-Solutions/eat-good-uganda/branches/master/protection \
  --input - << 'EOF'
{
  "required_status_checks": {
    "enforcement_level": "everyone",
    "contexts": [
      "test-and-coverage / test",
      "test-and-coverage / typecheck",
      "test-and-coverage / lint",
      "security / security"
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "require_conversation_resolution": true,
  "require_branches_to_be_up_to_date": true,
  "restrict_who_can_push_to_matching_branches": {
    "user_login_restrictions": []
  }
}
EOF
```

---

## GitHub Web UI: How to Apply

1. Go to **Settings** → **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Enter "master" or "main" as the pattern
4. Check the boxes for:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - ✅ Require pull request reviews before merging
   - ✅ Require conversation resolution before merging
   - ✅ Require code owner review
5. Click **Create**

---

## Status Checks Configuration

### GitHub Actions Workflows

The following workflows are required status checks:

**File:** `.github/workflows/test-and-coverage.yml`
- Runs on: Pull requests and pushes
- Required status checks:
  - `test-and-coverage / test`
  - `test-and-coverage / typecheck`
  - `test-and-coverage / lint`

**File:** `.github/workflows/security.yml`
- Runs on: Pull requests and pushes to main branches
- Required status checks:
  - `security / security`

### Adding New Status Checks

When adding new required status checks:

1. Create GitHub Actions workflow
2. Add workflow name to `.github/BRANCH_PROTECTION.md`
3. Configure in branch protection rules:
   ```bash
   gh api repos/Junior-Reactive-Solutions/eat-good-uganda/branches/master/protection \
     -F required_status_checks.contexts=["new-workflow-name/step-name"]
   ```

---

## Dismissing Protection Rules (Emergency Only)

**Requires:** Admin access

If an emergency requires bypassing protection:

1. Go to **Settings** → **Branches**
2. Click **Edit** on the branch protection rule
3. Temporarily uncheck boxes as needed
4. **Click Save**
5. Merge the emergency fix
6. **Immediately re-enable** the rules

**IMPORTANT:** Always document emergency merges in a comment or issue for audit purposes.

---

## Common Issues & Solutions

### "Required status checks failed"

**Problem:** Your PR hasn't passed all status checks yet.

**Solution:**
1. Look at the check details (click "Details" next to failed check)
2. Fix the issue locally
3. Commit and push changes
4. Checks will re-run automatically

### "Merge blocked: conversation not resolved"

**Problem:** A review comment hasn't been resolved.

**Solution:**
1. Go to the "Conversation" tab in your PR
2. Address the comment (reply or fix code)
3. Resolve the conversation (comment box → "Resolve conversation")

### "Merge blocked: branch is out of date"

**Problem:** Your branch is behind `main`.

**Solution:**
1. Click "Update branch" button on the PR
2. Wait for tests to pass
3. Merge when ready

---

## Best Practices

✅ **DO:**
- Always create a PR for any changes, even small ones
- Link related issues in your PR description
- Run tests locally before pushing: `pnpm -w test`
- Respond to review comments promptly
- Keep PRs focused and reasonably sized

❌ **DON'T:**
- Force-push to `main` or `master`
- Merge without all reviews approved
- Ignore failing tests
- Add secrets to code
- Push directly to main (always use PR)

---

## Monitoring & Alerts

To stay informed about branch protection events:

1. Go to **Settings** → **Notifications**
2. Enable:
   - ✅ Pushes to my repositories
   - ✅ Pull request reviews
   - ✅ Pull request approvals
   - ✅ When a pull request is merged

---

## Questions?

If branch protection is blocking your work:
1. Check `.github/BRANCH_PROTECTION.md` (this file)
2. Ask in team Discussions
3. Create an issue with the `help-wanted` label

For emergency bypasses, contact a repository admin.
