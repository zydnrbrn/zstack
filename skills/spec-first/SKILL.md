---
name: spec-first
description: "Plan before implementation using OpenSpec artifacts. Use when a zstack task will change code, when the Antigonus gate fires, or when asked to plan first. Writes proposal, design, tasks, and delta specs, then stops for approval."
disable-model-invocation: true
---

# Spec first

Write the plan before the code. The plan is a committed OpenSpec change folder a reviewer can read in the PR. Implementation starts only after the operator approves.

## When this applies

- A playbook will edit product code, tests, configuration, migrations, or docs that outlive the change.
- The Antigonus gate fires. See `../antigonus-ops/SKILL.md`.
- The operator asks for a plan first.

Do not use this for read-only investigation, one-line fixes, or running checks, tests, or other local commands. Those never need an approval stop.

## Artifact contract

Create `openspec/changes/<slug>/` in the repository root. `<slug>` is kebab-case, derived from the goal, and checked against `openspec list --json` first so two runs do not collide.

Required files:

- `proposal.md` for why, what changes, capabilities, and impact.
- `design.md` for context, goals and non-goals, decisions with alternatives, risks, and migration.
- `tasks.md` for checkbox tasks grouped by dependency, each with its verification.
- `specs/<capability>/spec.md` for delta requirements and scenarios, one file per capability.
- `.openspec.yaml` for metadata and for `skip_specs: true` when no behavior changes.

A change with no spec-level behavior change sets `skip_specs: true` and keeps proposal, design, and tasks. Do not invent a requirement to satisfy validation.

Use the templates and instructions from the resolved schema. With the default `spec-driven` schema, run `openspec instructions <artifact> --change "<slug>" --json` and follow the returned template. Do not hand-write a different layout.

## Planning boundary

Planning writes planning artifacts only. Do not edit product code, run migrations, push, open PRs, or write progress to Notion as if the work were done. A request that says "fix it" authorizes planning, not implementation.

Stop after the artifacts are committed and presented. Wait for explicit approval.

## Resolve the CLI

Try in order:

1. `openspec` on `PATH`.
2. `~/.local/share/pnpm/bin/openspec`.
3. `npx -y @fission-ai/openspec`.

If none works, write the files directly in the documented layout and say that validation was skipped. Do not block planning on the CLI.

## Validate and commit

Run `openspec validate <slug> --strict`. Run `openspec status --change <slug>`. Fix every error before handing off. Commit the change folder to the working branch. The commit SHA goes into the tracker event.

## Cross-reference the tracker

In an Antigonus repository, record the tracker identities in `.openspec.yaml` so the local plan and the Notion trail point at each other:

```yaml
x-project: "<project page URL>"
x-issue: "<issue page URL>"
x-plan-event: "<progress tracker checkpoint URL>"
x-approval-event: "<progress tracker decision URL>"
```

Leave a field empty when it does not exist yet. `../antigonus-ops/SKILL.md` owns the writes.

## Hand off

Present the slug, the folder path, the commit SHA, the goal, the approach in a few lines, the open questions, and the exact approval action. Then stop.

## After approval

Mark `tasks.md` progress as you execute. Follow the existing zstack playbooks for implementation, verification, review, and the PR. Log progress events as `../antigonus-ops/SKILL.md` requires.

## Archive

After merge, archive the change so the delta specs become living specs:

```bash
openspec archive <slug>
openspec validate <capability> --strict
```

Verify `openspec/specs/<capability>/spec.md` exists and reflects the merged behavior.
