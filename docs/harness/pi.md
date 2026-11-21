# zstack in Pi

Pi is the primary harness for zstack. The package installs machine-wide and adds one extension plus every skill.

## Install

```bash
pi install /absolute/path/to/zstack
```

`pi list` shows the package declaration in `~/.pi/agent/settings.json`. Restart Pi or run `/reload` after install. The package manifest in `package.json` declares `extensions/zstack/index.ts` and `skills/`, so Pi discovers the extension and all skills automatically.

## What the extension adds

| Name | Purpose |
| --- | --- |
| `zstack_task` | Delegate to an isolated Pi subprocess. Used by every zstack playbook that says "spawn a subagent". |
| `/zstack` | Load the zstack mode skill and start a task. |
| `/zstack-help` | Load the help skill. |
| `/setup-zstack` | Set per-role model overrides in `~/.pi/agent/zstack.json`. |
| `/zstack-status` | Print install paths, agents, and overrides. Work in print mode uses `/skill:<name>` directly. |

`zstack_task` accepts the vocabulary zstack already uses. `subagent_type` picks `zstack-agent`, `comment-sicko`, `generalPurpose`, or `Explore`. `prompt` is the task; `task` is accepted as an alias. `readonly` limits the child to read tools. `worktree: true` runs the child in a detached git worktree. `file_attachments` are passed as paths, never inlined. `resume` prepends a prior report as context. `run_in_background` is accepted for playbook compatibility; issue several tool calls in one message for parallel work.

The child process inherits the parent session model and thinking level. With no override, every role stays on `inherit-parent`. Pi's own default is the source of truth. Do not pass model slugs from another harness to a Pi worker.

## Agents

Bundled agent prompts live in `agents/`. `zstack-agent` reads `skills/zstack/SKILL.md` before any work. `comment-sicko` is reserved for `/no-comments`. User agents in `~/.pi/agent/agents/` may override them by name.

## Model config

`/setup-zstack` writes `~/.pi/agent/zstack.json`. It is global, not repository-local. There is no `zstack-models.md` and no per-project rule file. A role with no entry inherits the parent model. `inherit-parent` and `auto` mean the same thing.

## Other harnesses

Skills are also linked into `~/.agents/skills/` for Codex and Grok and `~/.claude/skills/` for Claude Code. Those harnesses load the skills but do not load the Pi extension. Workflow steps that require delegation should run in Pi, or use each harness's native subagent tool with the same agent prompts.
