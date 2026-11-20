# Set up zstack

In this page you install the plugin, confirm the model defaults, and run your first task. Setup is one command plus a short conversation.

## Install from this source

This directory is the source. Pi runs implementation on Pi's default model. The T3 session reviews the work: Grok, Codex, Claude Code, OpenCode, or another T3 provider.

This tree derives from pstack by Lauren Tan.

In Claude Code inside a T3 session, commands take a `zstack:` prefix, such as `/zstack:setup-zstack`. The [Claude Code adapter](../harness/claude-code.md) covers the other differences.

## Pick your models

Run:

```text
/setup-zstack
```

[`/setup-zstack`](../../skills/setup-zstack/SKILL.md) detects the models you could override with, shows you every role, and offers to change any of them. It writes `zstack-models.md` at the root of the repository being configured, a small rule every zstack skill reads.

Every role defaults to `inherit-parent`: feature, refactoring, bug fix, perf, hillclimb, judgment and prose, swarm workers, arena runners, the arena cross-judge pool, and interrogate reviewers. A panel is one `inherit-parent` entry, not a list of frontier models. zstack omits the subagent `model` field, so workers inherit the parent session model. With Pi as the parent, Pi's default is the source of truth. `auto` means the same thing as `inherit-parent`.

You only override what you care about. A role with no line in the rule keeps the `inherit-parent` default. Delete a role's line to restore it. A rerun of `/setup-zstack` keeps your explicit overrides and never restores an earlier vendor's defaults.

## Accept the verification offers, or don't

At the end of setup, `/setup-zstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers it in depth.

If you're new to zstack, say yes. An agent that can check its own work keeps going until the check passes. An agent that can't hands every result back to you to check by hand. Of everything in this guide, the verification skill pays off the most.

Then setup offers once to generate a formal verification skill with [`/create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md), unless the project already has one. Tests check the cases someone thought to write. A formal verification skill checks one key property of your code, such as "a job never runs twice at once", in every case within a stated scope. Say yes when your code has concurrency, retries, a state machine, or a parser, where a bug is costly and tests rarely reach the case that breaks. Otherwise say no, and run it later if that changes. [Verify and ship](./06-verify-and-ship.md#prove-a-property-with-a-formal-verification-skill) covers it.

After setup, start a new task. Skills read the model rule when they run.

## Keep the cost in check

zstack spends extra tokens on subagents and review panels. That's the price of the rigor. To spend fewer:

- Keep every role on `inherit-parent` so workers use the parent model.
- If you override a role, choose a detected model you already have access to.
- Keep a panel override to one entry. Each entry runs one subagent.
- Save `/zstack` for work that needs rigor. A small, obvious edit doesn't.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/zstack add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt.

From here you can type normal follow-ups. Invoke `/zstack` again when the next task needs rigor.

Next: [Route work through `/zstack`](./02-zstack.md).
