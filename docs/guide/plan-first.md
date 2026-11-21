# Plan before you build

`/zstack` writes the plan first, then stops and waits for your approval. The plan is a committed OpenSpec change folder you read in the PR. Implementation starts only when you say go.

## Why the stop exists

A run that starts coding has already picked a shape. Reviewing that shape after the diff is reviewing a decision made without you. Reviewing it before the first edit costs one message.

The plan is also the artifact a later agent resumes from. It survives the chat, the worktree, and the session.

## What the plan contains

An approved plan is a folder under `openspec/changes/<slug>/` in the repository root:

| File | Holds |
| --- | --- |
| `proposal.md` | Why now, what changes, which capabilities the change touches, and its impact. |
| `design.md` | The context, goals and non-goals, each decision with its alternatives, the risks, and the migration. |
| `tasks.md` | Checkbox tasks grouped by dependency. Each one names how you know it is done. |
| `specs/<capability>/spec.md` | Behavior requirements as RFC 2119 statements with WHEN/THEN scenarios. |
| `.openspec.yaml` | Change metadata, the tracker cross-references, and `skip_specs` when no behavior changes. |

A pure refactor, a tooling change, or a docs change sets `skip_specs: true` and keeps the other three. Inventing a requirement to satisfy a validator is the wrong fix.

## When the gate fires

The gate fires when the task will edit product code, tests, configuration, migrations, or docs that outlive the change.

It stays out of the way for:

- Read-only work. `/how`, `/why`, `/recall`, `/interrogate`, and any question.
- One-line fixes and small mechanical edits with an obvious shape.
- Running checks, tests, builds, linters, formatters, and other local commands.
- `/babysit`, `/unslop`, `/no-comments`, `/reflect`, `/correct`, `/zstack-help`, `/ketchup`, and worktree cleanup.
- Resuming work whose plan you already approved, while the scope holds.

Those cost you nothing. No plan folder, no tracker row, no prompt.

## What the stop looks like

```text
/zstack add a --json flag to this command. text output stays byte-identical. verify both.
```

The reply names the goal, the change slug, the folder path, the commit SHA, the approach, the open questions, and what you approve. Then it stops.

You approve with a normal sentence. Silence is not approval, and neither is "going to bed" or "run until done". That matters most for overnight runs, where the plan is what keeps eight hours pointed at the right target.

## The Notion side

In a mapped repository, the plan commit also lands a Progress Tracker checkpoint that points at the local folder. Approval lands a Decision event that references the checkpoint. Implementation lands Verification, Review, Blocked, Handoff, and Release events as those things actually happen.

Routine checks, tests, and read-only questions write nothing. The tracker records progress, not terminal output.

Map a repository once:

```text
/antigonus-register https://app.notion.com/p/<project-page>
```

It writes `~/.pi/agent/antigonus.json`. A `.zstack/antigonus.json` in the repository overrides the machine entry. An unmapped repository is not a blocker. zstack asks once, then continues without tracker writes and says so.

## After approval

The matched playbook runs. The plan stays the contract: `tasks.md` checkboxes close as units land, and anything the plan did not cover comes back to you as a decision rather than a silent scope change.

After merge, archive the change so its delta specs become living specs:

```bash
openspec archive <slug>
```

The CLI lives at `~/.local/share/pnpm/bin/openspec` on this machine. zstack resolves it there when it is not on `PATH`, and writes the same files without validation when the CLI is absent.

## Pitfalls

- **Approving a plan you have not read.** The approval is the review. Read `proposal.md` and `tasks.md` at minimum.
- **Skipping the gate because the change "feels small".** The gate already exempts one-line fixes. If it fires, the change owns behavior someone will have to maintain.
- **Editing the plan silently mid-run.** Amend the plan file in its own commit so the diff shows the decision.
- **Treating the tracker row as evidence.** The row points at evidence. The commit, the test output, and the artifact are the evidence.

Next: [Route work through `/zstack`](./02-zstack.md).
