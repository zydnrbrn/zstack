---
name: setup-zstack
description: Configure which models zstack uses per role. Defaults inherit the parent session's model. Writes a repository-root model rule for explicit overrides. Use for /setup-zstack, "configure zstack models", "zstack budget", or changing zstack's model choices.
---

# Setup zstack

Write `zstack-models.md` at the root of the repository being configured for per-role overrides. Every role defaults to `inherit-parent`. `auto` means the same thing: omit the `Task` `model` field so the worker runs on the parent session's model. With Pi as the parent, Pi's own default is the source of truth.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to a `Task` subagent in this session. That is the dependable source for an explicit override. If the harness also exposes a models API or CLI that lists the user's entitled models, prefer it for completeness. If you cannot detect any, skip real slugs and keep the aliases. Never write a real slug you have not confirmed is available. No detection is needed for the defaults, because they are aliases.

### 2. Load current state

If `zstack-models.md` exists at the repository root, read it. Keep role lines that are explicit user choices. Drop retired roles such as `hardest tasks`, `architect runners`, `reflect tooling`, and `why investigators`, and drop old `# defaults:` and `# budget:` lines. A panel line that pins a list of named models becomes one `inherit-parent` entry. Never rewrite a role to a named model family; a re-run must not restore an earlier vendor's defaults. Tell the user which lines you changed.

### 3. Confirm the roles

Show the default table from step 5. Offer to override any role with a detected slug and effort, or leave it on `inherit-parent` / `auto`. Prefer AskQuestion over free text. Explain that `inherit-parent` and `auto` omit `model` and still use `zstack-agent`, a panel value is a single entry, and an un-overridden role on a Pi parent uses Pi's session default.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen slug is unavailable, stop and ask again.

### 5. Write the rule

Write `zstack-models.md` at the repository root with the `# defaults: 4` line and one line per role, using the same labels the zstack mode skill uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# zstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` means omit Task `model`; the role runs on the parent session model.
# defaults: 4
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: inherit-parent
arena runners: inherit-parent
arena cross-judge pool: inherit-parent
swarm workers: inherit-parent
interrogate reviewers: inherit-parent
```

### 6. Confirm

Tell the user the rule was written at the repository root and that skills read it when they run. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever zstack is installed: workspace, user, or plugin). On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (resolves wherever zstack is installed: workspace, user, or plugin). On no, move on without pushing.
