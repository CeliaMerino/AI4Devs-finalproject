---
name: /kan-pipeline
id: kan-pipeline
category: Workflow
description: Run the full KAN ticket pipeline (enrich → propose → apply → commit/PR/merge → archive)
---

Run the **kan-pipeline** orchestrator for Jira `KAN-*` tickets.

**Load skill:** `kan-pipeline` from `.cursor/skills/kan-pipeline/SKILL.md`

**Queue:** `ai-specs/queues/kan-implementation-queue.yaml`

**Input**: Optional argument after the command:

| Argument | Action |
|----------|--------|
| *(none)* | Start or resume the full queue |
| `status` | Show progress only |
| `next` | Process one ticket then stop |
| `KAN-XX` | Process that ticket only |
| `from KAN-XX` | Start at that ticket |
| `dry-run` | Plan next ticket without writes |

**Per-ticket steps (do not skip):**

1. **Preflight** — `main` + pull, tooling checks
2. **enrich-us** — fetch Jira, write enhanced story
3. **openspec-propose** — create change + artifacts on feature branch
4. **openspec-apply-change** — implement all tasks
5. **commit** — commit, push, PR to `CeliaMerino/AI4devs-finalproject:main`, wait CI, squash merge
6. **openspec-archive-change** — sync delta specs if any, archive change
7. **Reset** — checkout `main`, pull, next ticket

**On failure:** stop queue, update `ai-specs/queues/kan-pipeline-state.json`, report resume command.

**Examples:**

```
/kan-pipeline
/kan-pipeline next
/kan-pipeline KAN-18
/kan-pipeline status
/kan-pipeline from KAN-35
```
