# kilo-worktree-setup.md

## 🧭 Purpose

This document defines the **mandatory worktree-based development system** for Eat Good Uganda.

This project is a **multi-tenant SaaS platform**, meaning:

* mistakes affect multiple businesses
* data isolation is critical
* unsafe development practices are unacceptable

Worktrees ensure:

* isolation
* reproducibility
* safe parallel development
* controlled AI execution

---

## 🏗️ Core Principles

1. **Isolation First**

   * Every task runs in its own worktree
   * No shared working directories

2. **Branch = Worktree**

   * One branch maps to one worktree
   * No branch reuse across tasks

3. **Multi-Tenancy Safety**

   * `bakery_id` must always be enforced
   * No cross-tenant access under any condition

4. **Deterministic Development**

   * Every task must be reproducible from scratch

---

## 📁 Worktree Directory Structure

```
/worktrees/
  feature-auth/
  feature-orders/
  fix-admin-403/
  refactor-shared-types/
```

---

## 🔤 Branch Naming Convention

| Type     | Format          | Example                |
| -------- | --------------- | ---------------------- |
| Feature  | feature/<name>  | feature/orders-system  |
| Fix      | fix/<name>      | fix/admin-403          |
| Refactor | refactor/<name> | refactor/api-structure |
| Test     | test/<name>     | test/order-flow        |
| Chore    | chore/<name>    | chore/ci-setup         |

---

## ⚙️ Worktree Lifecycle

### 1. Pre-Check (MANDATORY)

Before starting:

* Read `/docs`
* Read `/instructions`
* Read `/context`
* Confirm task scope

---

### 2. Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/<name>
```

---

### 3. Create Worktree

```bash
git worktree add worktrees/feature-<name> feature/<name>
```

---

### 4. Initialize Environment

```bash
cd worktrees/feature-<name>
pnpm install
```

---

### 5. Development Phase

Rules:

* Only edit files inside worktree
* Follow all `/instructions` rules
* Do not modify unrelated modules

---

### 6. Validation Phase

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

---

### 7. Commit Phase

```bash
git add .
git commit -m "feat: <description>"
```

---

### 8. Push Phase

```bash
git push origin feature/<name>
```

---

### 9. Pull Request Phase

PR must include:

* summary of changes
* affected modules
* risk assessment
* validation proof

---

### 10. Cleanup Phase

```bash
git worktree remove worktrees/feature-<name>
git branch -d feature/<name>
```

---

## 🤖 AI Agent Operating Rules

Each AI agent must:

1. Scan project before acting
2. Declare scope clearly
3. List files it will modify
4. Follow multi-tenancy rules strictly
5. Validate before committing

---

## 🧩 Multi-Agent Coordination

### Allowed

* Parallel work on different modules

### Forbidden

* Editing same file across agents
* Shared state across worktrees

---

## 🔐 Multi-Tenancy Enforcement (CRITICAL)

Every implementation must ensure:

* All DB queries include `bakery_id`
* Middleware enforces tenant isolation
* No global queries without scoping

Violation = **immediate rejection**

---

## 🔄 Syncing Strategy

Before work:

```bash
git fetch origin
git rebase origin/main
```

If conflict:

* resolve manually
* re-run tests

---

## ⚠️ Conflict Resolution Strategy

If merge conflict occurs:

1. Identify conflicting files
2. Validate tenant safety
3. Prefer correct logic over quick merge
4. Re-test everything

---

## 🧪 Testing Requirements

Each worktree must:

* pass all tests
* not break shared modules
* validate tenant isolation

---

## 🧹 Cleanup Rules

After merge:

* remove worktree
* delete branch
* ensure no leftover artifacts

---

## 🚫 Forbidden Actions

* editing `main` directly
* skipping tests
* committing secrets
* bypassing tenant checks
* hardcoding bakery data
* modifying global configs unnecessarily

---

## 🧠 AI Execution Lifecycle

1. Scan project
2. Read instructions
3. Create worktree
4. Implement feature
5. Validate
6. Commit
7. Push
8. PR
9. Cleanup

---

## 🚀 Example Full Workflow

```bash
git checkout main
git pull origin main
git checkout -b feature/orders
git worktree add worktrees/feature-orders feature/orders
cd worktrees/feature-orders
pnpm install

# develop

pnpm test
git add .
git commit -m "feat: orders system"
git push origin feature/orders
```

---

## 📌 Best Practices

* Keep worktrees small and focused
* Avoid long-lived branches
* Merge frequently
* Test aggressively

---

## ✅ Definition of Done

A task is complete when:

* feature implemented
* tests pass
* no tenant leaks
* PR created
* worktree cleaned

---

## 🧾 Notes

This system is REQUIRED for:

* AI agents
* developers
* experimental features

Failure to follow it risks:

* data leaks
* broken builds
* system instability

---
