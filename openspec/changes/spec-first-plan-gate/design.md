# Design

## Context

See proposal.md for motivation. The mechanics that shape this design:

- `extensions/zstack/index.ts` maps `/zstack` to `/skill:zstack`.
- `skills/zstack/SKILL.md` routes to 22 playbooks. Code playbooks start with tracing or `architect`, then delegate implementation.
- `multi-phase-plan.md` already says "Do not implement" and "Execution starts on the operator's explicit go", but it is reached only when the request is already a plan.
- `show-me-your-work` keeps a local TSV trail, not Notion.
- Progress Tracker has fixed fields: Event Type, Result, Project, Issue, Environment, Source SHA, Evidence URL, Agent Run, Summary, Next Action. It has no approval or correction option.
- OPS-08 governs appends, evidence, reconciliation, and corrections.
- OpenSpec 2.1.1 is installed at `~/.local/share/pnpm/bin/openspec`. Its `spec-driven` schema validates proposal, delta specs, design, and tasks, and its propose workflow has a hard planning boundary.
- `clients/svgarpyle-workspace/svgarpyle/.agents/skills/notion-operations/SKILL.md` already implements session start and milestone logging for one repository.

## Goals / Non-Goals

**Goals:**

- One planning standard across every Antigonus repository.
- Plan committed to the working branch and reviewable in the PR.
- Hard stop before implementation unless the operator approves.
- Notion trail only for real progress, per OPS-08.
- Project-agnostic zstack skills that read the latest Notion documents.

**Non-Goals:**

- Replacing zstack playbooks with OpenSpec workflows.
- A new Notion schema or approval field.
- Cross-repo OpenSpec Stores in this change.
- Writing to Notion from workers.
- Hardcoding Svgarpyle specifics into zstack.

## Decisions

### D1. Adopt OpenSpec `spec-driven` artifacts as the zstack standard

Each change folder carries `proposal.md`, `design.md`, `tasks.md`, and delta specs under `specs/<capability>/spec.md`.

- Alternative: Superpowers `docs/superpowers/specs/` and `docs/superpowers/plans/`. Rejected because zstack already owns execution discipline, and Superpowers' skill chain duplicates `architect`, `arena`, `swarm`, and `tdd`.
- The CLI is used for `validate`, `status`, and `archive` when found. Skills write compatible files directly so a missing CLI degrades gracefully.
- `openspec/config.yaml` pins `schema: spec-driven`, which is also the default.

### D2. Two new skills, not one

- `spec-first` owns the generic artifact contract, planning boundary, and approval handoff. It holds no Notion knowledge.
- `antigonus-ops` owns Notion resolution, live OPS reads, event protocol, and handoff. It holds no client names.
- Alternative: one combined skill. Rejected because a non-Antigonus fork should be able to use `spec-first` alone.

### D3. Gate lives in `skills/zstack/SKILL.md` non-negotiables, before routing

The gate applies to every route except Investigation, read-only questions, one-line fixes, and local command runs.

- Alternative: edit each playbook. Rejected because one missed playbook silently bypasses the gate.
- Session overrides such as "going to bed" do not bypass the gate. An approved plan is a precondition for autopilot and overnight runs.

### D4. Commit the plan before approval

The checkpoint event carries the commit SHA and the `openspec/changes/<slug>/` path.

- Alternative: keep the plan uncommitted until approval. Rejected because the reviewer needs a stable artifact and the PR should show the plan.

### D5. Machine-wide repo-to-Project map with a repo override

`~/.pi/agent/antigonus.json` is keyed by absolute repository path. `.zstack/antigonus.json` overrides per repository. Registration happens through the zstack extension.

- Alternative: infer the Project by searching Notion for the git remote. Rejected because remotes are ambiguous and the map is cheap.
- Svgarpyle is seeded during implementation. The zstack repository has no Project page today, so internal entries leave Project empty as ANTPROG-140 did.

### D6. Only the parent lead writes Notion

Workers return evidence to the lead. This matches the single orchestration owner in OPS-02 and prevents duplicate events.

### D7. Approval is a chat decision recorded as a Decision event

No new Notion field, because OPS-08 forbids competing status fields and Progress Tracker has no approval option. Corrections use a Checkpoint that references the superseded entry.

### D8. Consolidate repository-local Notion skills into pointers

Svgarpyle keeps its source map in `docs/references/notion-sources.md`. Its skill points to `antigonus-ops`.

## Risks / Trade-offs

- Gate cost on small work. Mitigation: one-line fixes and local runs are exempt; everything else plans.
- OpenSpec CLI absent from `PATH`. Mitigation: resolve `~/.local/share/pnpm/bin/openspec`, then `npx @fission-ai/openspec`, then proceed without CLI validation.
- Notion write fails. Mitigation: report the exact tool and error, continue only safe audit work, and leave a pending-synchronization note per OPS-08.
- Dirty zstack checkout. Mitigation: this change lands on a branch in a detached worktree, never in the main checkout.
- Agents skip the gate. Mitigation: run the eval playbook blind on the skill change, plus frontmatter and link checks.
- Duplicate plan folders. Mitigation: derive the slug from the goal and check `openspec list --json` first.
- Plan artifacts become stale specs after archive. Mitigation: archive only after merge, then verify the living spec.

## Migration Plan

1. Create a worktree off `main` in `ops/zstack`.
2. Commit this change folder.
3. Post the plan Checkpoint to Progress Tracker.
4. On approval, implement task groups in order and verify each.
5. Open a PR through the Opening a PR playbook.
6. Archive after merge so `openspec/specs/change-planning/spec.md` becomes the living spec.

Rollback: delete the branch. No product code or Notion schema changes land before approval.

## Open Questions

None. The operator settled the artifact standard, stop-by-default behavior, exemptions, and commit-before-approval.
