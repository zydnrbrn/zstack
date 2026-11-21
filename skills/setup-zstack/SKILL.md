---
name: setup-zstack
description: Configure zstack model roles machine-wide. Defaults inherit the parent session's model. Writes ~/.pi/agent/zstack.json. Use for /setup-zstack, "configure zstack models", "zstack budget", or changing zstack's model choices.
---

# Setup zstack

Write `~/.pi/agent/zstack.json` for per-role overrides. The config is machine-wide, not repository-local. Every role defaults to `inherit-parent`, and `auto` means the same thing: omit the child `model` field so the worker runs on the parent session's model. With Pi as the parent, Pi's current model is the source of truth.

In Pi, `/setup-zstack` is an extension command that performs this flow with a picker. When this skill is loaded directly, follow the steps yourself.

## Steps

### 1. Detect available models

Enumerate the models available in this session. In Pi, `ctx.modelRegistry.getAvailable()` is the dependable source for an explicit override. If the harness also exposes a models API or CLI that lists entitled models, prefer it for completeness. If you cannot detect any, skip real slugs and keep the aliases. Never write a real slug you have not confirmed is available. No detection is needed for the defaults.

### 2. Load current state

If `~/.pi/agent/zstack.json` exists, read it. Keep role entries that are explicit user choices. Drop retired roles such as `hardest tasks`, `architect runners`, `reflect tooling`, and `why investigators`, and drop old `# defaults:` and `# budget:` lines. A panel line that pins a list of named models becomes one `inherit-parent` entry. Never rewrite a role to a named model family; a re-run must not restore an earlier vendor's defaults. Tell the user which entries you changed.

### 3. Confirm the roles

Show the default table from step 5. Offer to override any role with a detected model, or leave it on `inherit-parent` / `auto`. Explain that `inherit-parent` and `auto` omit the child `model` field and still use `zstack-agent`, a panel value is a single entry, and an un-overridden role on a Pi parent uses Pi's current model.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen slug is unavailable, stop and ask again.

### 5. Write the config

Overwrite the whole file so re-runs stay idempotent. Shape:

```json
{
  "version": 1,
  "roles": {
    "feature, refactoring": "inherit-parent",
    "bug-fix": "inherit-parent",
    "perf-issue": "inherit-parent",
    "hillclimb": "inherit-parent",
    "judgment and prose": "inherit-parent",
    "arena runners": "inherit-parent",
    "arena cross-judge pool": "inherit-parent",
    "swarm workers": "inherit-parent",
    "interrogate reviewers": "inherit-parent"
  }
}
```

An omitted role is the same as `inherit-parent`. Writing explicit `inherit-parent` entries is fine but not required.

### 6. Confirm

Tell the user the config was written at `~/.pi/agent/zstack.json` and that workers read it when they run. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever zstack is installed). On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill`. On no, move on without pushing.
