# Proposal

## Why

`/zstack` routes straight into implementation playbooks. Nothing creates a durable technical plan before code, and nothing records the plan in Notion unless the lead does it by hand. Approval happens after the fact or not at all, and the business record drifts from the branch.

Antigonus already governs this work through Notion. OPS-08 defines an append-only Progress Tracker, OPS-01 defines lifecycle, OPS-02 defines session start and handoff, and OPS-04 defines evidence. What is missing is a machine-enforced gate in zstack plus a local plan artifact a reviewer can read in the PR.

## What Changes

- Adopt the OpenSpec `spec-driven` artifact layout as the zstack planning standard.
- Add a generic `spec-first` skill that owns the local change folder, the planning boundary, and the approval handoff.
- Add a project-agnostic `antigonus-ops` skill that resolves the repo to a Notion Project, reads the latest OPS documents live, appends Progress events, and cross-references the local plan and the Notion trail.
- Add a gate to `skills/zstack/SKILL.md` so every routed task plans first, then stops for approval. Read-only investigations, one-line fixes, and local command runs are exempt.
- Store a machine-wide repo-to-Project map at `~/.pi/agent/antigonus.json`, with a per-repo override.
- Commit the plan to the working branch before requesting approval.
- Consolidate Svgarpyle's `.agents/skills/notion-operations/SKILL.md` into a pointer to `antigonus-ops`.
- Update the guide, harness adapters, and README.

## Capabilities

### New Capabilities

- `change-planning`: How zstack turns a request into an approved local plan and a matching Notion progress trail before implementation starts.

### Modified Capabilities

- None. The zstack repository has no living specs yet.

## Impact

- zstack skills: `zstack`, new `spec-first`, new `antigonus-ops`, `zstack-lead`, `multi-phase-plan`.
- zstack extension: registration flow for the repo-to-Project map.
- Machine config: `~/.pi/agent/antigonus.json`.
- Svgarpyle repository: `.agents/skills/notion-operations/SKILL.md` becomes a pointer.
- Notion: Progress Tracker fields only, no schema change.
- Tooling: OpenSpec CLI 2.1.1 is installed at `~/.local/share/pnpm/bin/openspec`, which is not on `PATH`. zstack resolves it explicitly or degrades to writing compatible files without validation.
