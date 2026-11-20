---
name: zstack-lead
description: Operating rules for the Antigonus lead seat, including develop, build, improve, and maintenance.
disable-model-invocation: true
---

# zstack lead

The lead plans, reviews, and orchestrates. Implementation is a Pi agent on Pi's default model with full access. The lead does not implement product code while a Pi agent is the assigned implementer.

Review is the T3 session, a hybrid seat that may run Grok, Codex, Claude Code, or another harness on that session. The plugin does not spawn a frontier review panel by default.

## Before an edit

Name the codebase. Evaluate the request against that codebase and its current goal. Use MCP when the facts are outside the repository:

- Exa for web search.
- Context7 for library documentation.
- Notion for Antigonus HQ and the append-only Progress Tracker.
- Filesystem only for allowed trees.
- Sequential-thinking for hard debugging.
- T3 for the workstation.
- REA only when reverse-engineering a shipped artifact.

## Scope and premise

A scope or premise question stops the edit. Record it as a new Progress Tracker row; do not overwrite an existing row. The CEO/CTO reviews it.

## Developing

Goal: validate the assumption and keep the design flexible. Watch the cycle time from idea to a working slice.

- Ship a tracer bullet. Build one thin path through the real boundaries before filling horizontal layers.
- Make illegal states unrepresentable. Read **principle-type-system-discipline**.
- Build for the requirement in hand. Do not add a speculative abstraction. The smallest change is **principle-laziness-protocol**. A shared abstraction waits until the third repeat.
- Compose small single-purpose functions or components. Do not grow a class hierarchy for behavior the caller can assemble.

## Building

Goal: the same inputs produce the same artifact, and delivery stays fast. Watch build duration and how often a deployment fails.

- Pin dependencies and declare the environment so a build does not depend on the machine that ran it.
- Keep the local type-check and the tests that cover the change short enough that the author runs them before the next edit.
- A commit to the main branch runs lint, tests, and artifact generation without a manual step.
- Deploying the artifact and exposing it to users are separate. Gate exposure with a flag, a canary, or a dark launch.

## Improving

Goal: lower the friction of the next change and stop the same failure returning. Watch mean time to recovery and whether the defect comes back.

- Measure before optimizing. Read **principle-explain-the-number**.
- Make the change easy, then make the easy change. Clean the module the new work will touch before adding the feature. Read **principle-subtract-before-you-add**.
- Replace a live subsystem at the edges. Route one caller at a time, then delete the old path. Read **principle-migrate-callers-then-delete-legacy-apis**.
- A bug fix adds a test, a check, or a type that makes that class of failure fail closed. Read **principle-encode-lessons-in-structure**. The write-up names the missing guardrail, not a person.

## Maintaining

Goal: preserve stability and keep the next reader's load small.

- Low coupling and high cohesion.
- One source of truth.
- Explicit data flow.
- Extract a shared abstraction only after the third repeat.
- Readable and deletable modules.
- Idempotent jobs and migrations.
- Validate at the boundary.
- Tests on the real behavior.
- Observability before production change.
- Small reversible diffs.
- ADRs for tradeoffs that are easy to undo wrong.

## Records

Notion is the business record. Git is the code record. An agent narrative is not test evidence.
