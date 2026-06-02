# GitHub Labels Configuration

This document defines all labels used in the Eat Good Uganda repository for issue and PR organization.

## How to Apply Labels

Labels are automatically applied to issues and PRs based on:
1. **File changes** — `.github/workflows/labeler.yml` auto-labels PRs
2. **Dependabot** — Automatically labels dependency updates
3. **Manual assignment** — Team members can manually add labels

## Label Categories

### 🎯 Type Labels (What is this?)
These describe the nature of the issue or PR.

| Label | Color | Description | When to Use |
|-------|-------|-------------|------------|
| `type/bug` | `#d73a49` | Something isn't working | Unexpected behavior, crash, error |
| `type/feature` | `#0366d6` | New functionality | New feature request or implementation |
| `type/enhancement` | `#84b6eb` | Improvement to existing feature | Making something work better |
| `type/refactor` | `#cccccc` | Code refactoring | Cleanup, reorganization, no behavior change |
| `type/documentation` | `#0075ca` | Improvements to documentation | Docs, README, comments, guides |
| `type/chore` | `#999999` | Maintenance tasks | Dependency updates, tool updates |
| `type/question` | `#d876e3` | Further information requested | Clarification needed |

### 🔧 Area Labels (Where is this?)
These identify which part of the codebase is affected.

| Label | Color | Description |
|-------|-------|-------------|
| `area/backend` | `#ff6b6b` | API routes, business logic |
| `area/frontend` | `#4ecdc4` | React apps, UI components |
| `area/database` | `#ffd93d` | Database, migrations, queries |
| `area/auth` | `#a8e6cf` | Authentication, authorization |
| `area/payments` | `#ffd3b6` | Payment processing, credentials |
| `area/analytics` | `#ffaaa5` | Metrics, dashboards, reporting |
| `area/testing` | `#ff8b94` | Tests, test infrastructure |
| `area/ci-cd` | `#ffb3ba` | GitHub Actions, deployment |
| `area/docs` | `#bae1ff` | Documentation site, guides |
| `area/infrastructure` | `#a0c4ff` | DevOps, deployment, infrastructure |

### ⚠️ Priority Labels (How urgent?)
These indicate priority and urgency.

| Label | Color | Description | When to Use |
|-------|-------|-------------|------------|
| `priority/critical` | `#b60205` | Critical issue affecting users | Production outage, data loss risk |
| `priority/high` | `#ff6b6b` | High priority, should be addressed soon | Major feature, important bug |
| `priority/medium` | `#ffa500` | Normal priority | Regular feature or bug |
| `priority/low` | `#82e985` | Low priority, nice-to-have | Minor improvements, polish |
| `priority/future` | `#cccccc` | Planned for later | Backlog, long-term roadmap |

### 🏷️ Status Labels (What's the status?)
These track the state of work.

| Label | Color | Description | When to Use |
|-------|-------|-------------|------------|
| `status/needs-triage` | `#fbca04` | Needs initial review | New issues not yet reviewed |
| `status/needs-discussion` | `#d4c5f9` | Discussion needed | Needs team decision |
| `status/needs-design` | `#e99695` | Design needed | Needs design review first |
| `status/in-progress` | `#0366d6` | Currently being worked on | Assigned and active |
| `status/blocked` | `#b60205` | Blocked by something | Waiting for dependency |
| `status/ready` | `#28a745` | Ready to start | Requirements clear, can begin |
| `status/review-needed` | `#fbca04` | Waiting for code review | PR submitted |
| `status/approved` | `#28a745` | Approved and ready to merge | Code review passed |
| `status/done` | `#28a745` | Completed and merged | Issue resolved |
| `status/wontfix` | `#ffffff` | Won't be fixed | Decided not to address |
| `status/duplicate` | `#cccccc` | Duplicate of another issue | Links to original |

### 🎓 Knowledge Labels (What expertise needed?)
These help with knowledge sharing and assignment.

| Label | Color | Description |
|-------|-------|-------------|
| `knowledge/junior-friendly` | `#91ca55` | Good for junior developers |
| `knowledge/architecture` | `#6f42c1` | Requires understanding of system design |
| `knowledge/security` | `#d73a49` | Requires security expertise |
| `knowledge/performance` | `#f97316` | Requires performance optimization |
| `knowledge/accessibility` | `#2dd4bf` | Accessibility standards knowledge |

### 📦 Dependency Labels (Auto-applied by Dependabot)
These are automatically applied for dependency updates.

| Label | Color |
|-------|-------|
| `dependencies` | `#0366d6` |
| `npm` | `#cb3837` |
| `github-actions` | `#2088f0` |

### ✨ Special Labels

| Label | Color | Description |
|-------|-------|-------------|
| `good-first-issue` | `#7057ff` | Good for first-time contributors |
| `help-wanted` | `#33aa3f` | Help wanted from community |
| `pinned` | `#ffd700` | Important, keep at top |
| `epic` | `#9966cc` | Large feature spanning multiple issues |
| `work-in-progress` | `#fbca04` | WIP, do not merge yet |
| `stale` | `#cccccc` | Inactive, will be closed soon |

---

## Labeling Workflow

### For New Issues
1. Assign `type/*` label (bug, feature, etc.)
2. Assign `area/*` label (where is it?)
3. Assign `priority/*` label (how urgent?)
4. Assign `status/needs-triage` initially

### For Issues Under Discussion
1. Change status to `status/needs-discussion`
2. Add relevant knowledge labels if needed

### For Issues Ready to Work
1. Change status to `status/ready`
2. Add `knowledge/*` labels for required expertise
3. Optionally add `good-first-issue` if suitable

### For PRs
1. Auto-labeled by `.github/workflows/labeler.yml`
2. Add `status/review-needed` when submitted
3. Update to `status/approved` after review
4. Change to `status/done` after merge

---

## Label Combinations

### Critical Bug
- `type/bug`
- `area/*` (relevant area)
- `priority/critical`
- `status/in-progress`

### Feature Request
- `type/feature`
- `area/*` (relevant area)
- `priority/medium` or `/high`
- `status/needs-discussion` (until approved)

### Dependency Update
- `type/chore`
- `dependencies` (auto-applied)
- `area/ci-cd` (usually)
- Auto-labeled by Dependabot

### Security Issue
- `type/bug`
- `area/security` or relevant area
- `priority/critical`
- `knowledge/security`

---

## GitHub API: Creating Labels

To programmatically create these labels, use:

```bash
# Example: Create a label via GitHub CLI
gh label create "type/bug" \
  --description "Something isn't working" \
  --color "d73a49"

gh label create "priority/critical" \
  --description "Critical issue affecting users" \
  --color "b60205"
```

Or use this script to create all labels:

```bash
#!/bin/bash
# Script to create all labels (add to .github/scripts/create-labels.sh)

labels=(
  "type/bug:d73a49:Something isn't working"
  "type/feature:0366d6:New functionality"
  # ... add all labels
)

for label in "${labels[@]}"; do
  IFS=':' read -r name color desc <<< "$label"
  gh label create "$name" --description "$desc" --color "$color" || true
done
```
