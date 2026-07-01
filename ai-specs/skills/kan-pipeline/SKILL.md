---
name: kan-pipeline
description: >-
  Orchestrate the full Jira ticket lifecycle for KAN-* tickets: enrich-us →
  openspec-propose → openspec-apply-change → commit/PR/merge → openspec-archive-change,
  then reset to main for the next ticket. Use with the queue in ai-specs/queues/kan-implementation-queue.yaml.
author: Reading Analytics Platform
version: 1.0.0
---

# kan-pipeline Skill

End-to-end **multi-step agent workflow** for implementing `KAN-*` Jira tickets in strict order.

**Announce at start:** "I'm using the kan-pipeline skill."

## Input

`$ARGUMENTS` may be:

| Argument | Behavior |
|----------|----------|
| *(empty)* | Resume or start the queue from the first pending ticket |
| `status` | Show queue progress without running steps |
| `next` | Run exactly one ticket, then stop |
| `KAN-XX` | Run pipeline for that ticket only (must exist in queue) |
| `from KAN-XX` | Start queue at that ticket (skip earlier completed ones) |
| `dry-run` | Print planned steps for the next ticket; no git/Jira/OpenSpec writes |

## Queue source

Read ticket order from **`ai-specs/queues/kan-implementation-queue.yaml`**.

Track progress in **`ai-specs/queues/kan-pipeline-state.json`**:

```json
{
  "tickets": {
    "KAN-18": {
      "status": "done|in_progress|failed|skipped|pending",
      "change_name": "kan-18-design-tokens",
      "branch": "feature/KAN-18-design-tokens",
      "pr_url": "https://github.com/...",
      "archived_at": "2026-07-01T12:00:00Z",
      "error": null
    }
  }
}
```

Update state after **each step** so a interrupted run can resume safely.

## Per-ticket pipeline (strict order)

Complete **all** steps for one ticket before starting the next.

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────┐    ┌─────────┐    ┌──────────┐
│ 0 Preflight │ →  │ 1 enrich-us  │ →  │ 2 opsx-propose  │ →  │ 3 apply│ →  │ 4 commit│ →  │ 5 archive│
└─────────────┘    └──────────────┘    └─────────────────┘    └────────┘    └─────────┘    └──────────┘
                                                                                  │ PR + merge
                                                                                  ▼
                                                                           6 reset main + pull
```

### Step 0 — Preflight

1. Confirm working tree is clean or stash; use `/kan-pipeline` resume from a failed step.
2. `git checkout main && git pull origin main`
3. Verify `openspec` CLI works: `openspec list --json`
4. Verify Atlassian MCP (`user-atlassian`) is available for Jira fetch.
5. Verify `gh` is authenticated for `CeliaMerino/AI4devs-finalproject`.
6. Mark ticket `in_progress` in state file.

### Step 1 — enrich-us

**Skill:** `enrich-us` (Jira mode)

1. Fetch `KAN-XX` via Atlassian MCP (`jira_get_issue`).
2. Produce `## Original` and `## Enhanced` sections per enrich-us rules.
3. Use project context: `PRD.md`, `readme.md`, `documents/`, `docs/api-spec.yml`, `docs/data-model.md`.
4. Save enhanced story to `openspec/changes/.drafts/KAN-XX-enhanced.md` (create `.drafts` if needed).
5. Optionally write back to Jira (append enhanced content; move `To refine` → `Pending refinement validation`).

**Pause if:** Jira fetch fails, ticket is empty, or enhanced story lacks enough detail for OpenSpec.

### Step 2 — openspec-propose

**Skill:** `openspec-propose`

1. Derive **change name** from queue config `change_name_pattern` (default `kan-{number}-{slug}`):
   - Slug from Jira summary: lowercase, hyphenated, max 40 chars, English.
   - Example: `KAN-18` + "Design tokens + base components" → `kan-18-design-tokens`.
2. Create branch **before** artifacts (see Branch policy below):
   ```bash
   git checkout -b feature/KAN-18-design-tokens
   ```
3. Run full openspec-propose workflow using the **enhanced story** as input context.
4. Record `change_name` in state file.

**Pause if:** A change with that name already exists — ask whether to continue, rename, or abort.

### Step 3 — openspec-apply-change

**Skill:** `openspec-apply-change`

1. Read apply instructions: `openspec instructions apply --change "<name>" --json`
2. Read all `contextFiles`.
3. Implement **every** pending task; mark `- [x]` immediately after each.
4. Run targeted verification when tasks specify tests:
   - Backend: `npm test` / `npm run test` in `backend/`
   - Frontend: `npm test` in `frontend/`
   - Lint only if fast and relevant
5. Do **not** commit yet — commit skill handles git in step 4.

**Long-running apply:** For tickets with many tasks, you may delegate to a `generalPurpose` subagent with the apply skill loaded, passing full context (change name, enhanced story, queue ticket id). The orchestrator must verify all tasks are checked before proceeding.

**Pause if:** Blocked artifacts, failing tests that cannot be fixed, or ambiguous requirements.

### Step 4 — commit, PR, merge

**Skill:** `commit` (extended with merge)

1. Invoke commit workflow scoped to the ticket: `/commit KAN-XX`
2. Branch should already exist from step 2; commit skill stages all relevant changes, pushes, opens PR.
3. **PR target:** `CeliaMerino/AI4devs-finalproject:main`
4. **PR title:** `[KAN-XX] <short summary>`
5. **PR body** must include:
   - Link to Jira ticket
   - Summary of OpenSpec change and key files touched
   - Test plan checklist (from tasks.md / manual test notes)
   - OpenSpec change path: `openspec/changes/<change-name>/`
6. Wait for CI (if `merge.wait_for_checks`):
   ```bash
   gh pr checks --watch
   ```
7. Merge using queue config method (default **squash**):
   ```bash
   gh pr merge --squash --delete-branch
   ```
   Use `--merge` or `--rebase` when queue config says so.
8. Record `pr_url` and merge commit in state file.

**Pause if:** CI fails, merge conflicts, branch protection blocks merge, or review required.

### Step 5 — openspec-archive-change

**Skill:** `openspec-archive-change`

1. Run delta spec sync assessment (sync when delta specs exist — default **sync now** unless user configured otherwise in queue).
2. Archive: `mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>/`
3. Mark ticket `done` in state; set `archived_at`.

### Step 6 — Reset for next ticket

```bash
git checkout main
git pull origin main
```

Delete local feature branch if it still exists after merge. Proceed to next pending ticket in queue order.

## Branch policy

| When | Branch |
|------|--------|
| Step 2 start | Create `feature/KAN-XX-<slug>` from updated `main` |
| Steps 3–4 | Stay on feature branch |
| Step 6 | Return to `main` |

Never implement two queue tickets on the same branch.

## Multi-ticket / queue modes

| Mode | Command | Behavior |
|------|---------|----------|
| Full queue | `/kan-pipeline` | Run tickets until blocked or queue empty |
| One ticket | `/kan-pipeline next` | One ticket then stop |
| Single ticket | `/kan-pipeline KAN-35` | That ticket only |
| Resume | `/kan-pipeline` | Skip `done`; retry `failed` from failed step |
| Status | `/kan-pipeline status` | Table of phases and ticket states |

## Error handling

On any step failure:

1. Mark ticket `failed` with `error` message and `failed_step` in state.
2. **Stop the queue** — do not auto-advance to the next ticket.
3. Report: ticket, step, error, suggested fix, resume command.
4. Resume with `/kan-pipeline` (retries from `failed_step`) or `/kan-pipeline from KAN-XX`.

## Output format (per ticket)

```markdown
## KAN-XX — <summary> ✓

| Step | Status | Notes |
|------|--------|-------|
| enrich-us | ✓ | openspec/changes/.drafts/KAN-XX-enhanced.md |
| propose | ✓ | change: kan-xx-slug |
| apply | ✓ | 12/12 tasks |
| commit + PR | ✓ | https://github.com/.../pull/N |
| merge | ✓ | squash → main |
| archive | ✓ | openspec/changes/archive/2026-07-01-kan-xx-slug/ |

**Next:** KAN-YY — <summary>
```

## Guardrails

- **One ticket at a time** — full pipeline before the next queue entry.
- **English** for commits, PRs, OpenSpec artifacts, and code (per AGENTS.md).
- **No force-push** to `main`.
- **No skip** of enrich or propose unless user explicitly says `skip-enrich` / `skip-propose`.
- **Do not merge** with failing required checks unless user confirms.
- **Sync delta specs** before archive when they exist (openspec-archive-change default).
- Respect phase dependencies in the queue YAML (`depends_on` is informational; order is already linear).

## Related skills & commands

| Step | Skill / command |
|------|-----------------|
| 1 | `enrich-us`, `/enrich-us KAN-XX` |
| 2 | `openspec-propose`, `/opsx-propose` |
| 3 | `openspec-apply-change`, `/opsx-apply` |
| 4 | `commit`, `/commit KAN-XX` |
| 5 | `openspec-archive-change`, `/opsx-archive` |
| Isolation (optional) | `using-git-worktrees` for parallel human work — pipeline uses feature branches on main checkout |

## Continuous processing (optional)

To run the queue with pauses between tickets, combine with the **loop** skill:

```
/loop 30m /kan-pipeline next
```

Use dynamic loop mode when merge/CI duration varies.
