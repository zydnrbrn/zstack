---
name: antigonus-ops
description: "Antigonus Notion operations for any client repository. Use when a zstack task runs in a mapped Antigonus repository, at session start, before writing progress, or when handing work to another agent. Resolves the repo to its Notion Project, reads the latest OPS documents live, and owns the append-only Progress Tracker trail."
disable-model-invocation: true
---

# Antigonus operations

This skill is project-agnostic. It holds no client names and no hardcoded identifiers. It resolves the repository to its Notion Project and reads the current governance documents from Notion every session, so the latest published protocol wins over any copied text.

## Resolve the repository

1. Find the repository root with `git rev-parse --show-toplevel`.
2. Load the machine map at `~/.pi/agent/antigonus.json`:

```json
{
  "repos": {
    "/absolute/repository/path": {
      "project": "https://app.notion.com/p/<project-page-id>",
      "issue": "https://app.notion.com/p/<issue-page-id>"
    }
  }
}
```

3. Load a per-repository override at `<repo>/.zstack/antigonus.json` with the same `project` and `issue` fields. The override wins.
4. Match the longest map key that is a path prefix of the repository root, so a monorepo subdirectory resolves to its workspace.
5. Register a repository with `/antigonus-register <project-url>` from its root, or write the map directly.

An unmapped repository is not a blocker. Ask once for the Project URL, save it, then continue. If the operator declines, proceed without tracker writes and say so in the reply.

## Read the live protocol

At session start, search Notion for the current `OPS-00`, `OPS-01`, `OPS-02`, `OPS-04`, and `OPS-08` pages and fetch their bodies. Do not trust protocol text copied into a skill, a memory, or an earlier chat. If a document moved, follow the search result. If Notion is unreachable, name the exact failure, continue only safe audit work, and do not claim protocol compliance.

Fetch the Progress Tracker data source schema before writing, and use its exact property names, relation targets, and enum values. Never invent a schema.

## Session start

1. Resolve the repository, Project, and optional Issue as above.
2. Fetch the live OPS documents and any Knowledge Base source the task names.
3. Read the Issue's current state and the recent Progress entries related to the Project and Issue, sorted by `Recorded At` descending. Follow pagination back to the previous handoff or unresolved blocker. Read event bodies, not just titles.
4. Inspect the Git root, branch, base and HEAD SHAs, staged and unstaged files, and relevant PR, CI, or runtime evidence.
5. Compare the records with what you observed. Name contradictions and missing evidence before claiming anything. Continue only inside the allocated scope and authorization.

Append a `Session Start` event when a new agent takes over allocated work. Do not append one for a pure read-only question.

## Plan checkpoint

When a local plan is committed and implementation has not started, append a `Checkpoint` event:

- Result `Unverified`, Environment `Local`, and the full commit SHA in `Source SHA`.
- `Summary` names the change slug and the plan folder.
- `Next Action` asks the CEO/CTO to approve the plan.
- The body carries the goal, scope, approach, the `openspec/changes/<slug>/` path, open questions, and the exact approval action.
- Relate the Project and Issue when known.
- Record the returned event URL in the change's `.openspec.yaml` as `x-plan-event`.

Stop after the checkpoint. Implementation starts only on explicit approval.

## Execution events

Log meaningful transitions only. Routine checks, tests, read-only questions, and tool output are not progress.

| Event Type | Use when |
| --- | --- |
| `Session Start` | A new agent takes over allocated work. |
| `Checkpoint` | A plan is ready, a material fork is chosen, or a correction supersedes an earlier entry. |
| `Review` | Independent review findings land. |
| `Verification` | Scoped tests or checks completed with traceable evidence. |
| `Blocked` | A blocker, missing authorization, or missing evidence stops progress. |
| `Handoff` | Ownership transfers or the run ends. |
| `Decision` | A plan is approved, a scope decision is made, or work is reverted. |
| `Release` | Deployment is confirmed. |
| `Baseline` | Initial state is captured before a change. |

Result is one of `Observed`, `Passed`, `Failed`, `Blocked`, `Unverified`.

Minimum fields for an engineering event: `Update`, `Event Type`, `Result`, `Environment`, `Summary`, and `Next Action`. Add `Source SHA`, `Evidence URL`, and `Agent Run` when known. Relate the Project and optional Issue. An agent narrative is a claim, not evidence, so link the artifact that proves it.

## Issue transitions

Update the existing Issue's `Status`, `Verification`, and `Next Action` only when evidence justifies a real lifecycle transition under the live OPS lifecycle. Re-read the Issue immediately before writing. Never duplicate current status on a Progress event. If the event and the Issue disagree, mark the conflict for reconciliation instead of guessing. Approved scope, production changes, access controls, and client acceptance require explicit human authorization.

Corrections are append-only. Add a `Checkpoint` that references the superseded entry and states what actually happened. Never edit or delete an earlier event to hide a mistake.

## Single writer

Only the parent lead writes to Notion. Delegated workers return evidence, file paths, SHAs, and observed results to the lead. The lead owns every Progress event and Issue update. This keeps one writer and matches the orchestration rule in OPS-02.

## Handoff

End a run with a self-contained handoff:

- Project and Issue URLs, assigned agent or run if known, scope, and applicable decisions.
- Worktree or branch, base SHA, full HEAD SHA, and the uncommitted files if the tree is dirty.
- What changed, with criterion, evidence, and observed result for each.
- What is approved scope, implemented, tested locally, checked in CI, verified in staging, verified live, released, and accepted. Mark absent evidence as unverified and name the artifact that would resolve it.
- Blockers, remaining authorization gates, and the concrete next action.
- The Progress event URL and the actual Issue transition, or `Pending synchronization, no Notion write performed`.

## Failure handling

- If a Notion write fails, report the exact tool and error, keep the event text, and continue only work that does not depend on the tracker.
- Before retrying, re-read the recent events to avoid duplicates.
- If a checkpoint append succeeds but an Issue update fails, report partial synchronization and keep both URLs.
- Leave a dated pending-synchronization note in the session output or an explicitly marked repository artifact. It is not a competing tracker.
- Never publish secrets, private customer data, invented run IDs, completion percentages, deadlines, test results, releases, or acceptance.

## Rules

- Fetch the latest OPS documents every session. Do not hardcode their contents.
- Resolve every Project and Issue through the map or a live search. Never guess an identifier.
- Write progress only for implementation progress and material transitions.
- Keep the skill free of client-specific names and repository specifics.
