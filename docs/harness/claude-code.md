# zstack in Claude Code

Claude Code reads zstack skills from the user-scope directory `~/.claude/skills/`, linked at install time. No repository config is needed.

## Conventions

- Skills are invoked by name, for example `/zstack`, `/setup-zstack`, and `/zstack-help`.
- The zstack mode skill is `zstack`. The delegate is `zstack-agent`. Comment review is `comment-sicko`.
- Model overrides written by Pi's `/setup-zstack` apply only to Pi workers. Claude Code uses its own model settings.
- Every zstack role defaults to the session model. Do not pin a worker to a vendor model without an explicit user choice.

## Delegation

Claude Code's `Agent` tool replaces the playbook's generic `Task` call. Give each `zstack-agent` worker the absolute path to `skills/zstack/SKILL.md` and require it to read that file before any work. Use `comment-sicko` only for `/no-comments`. Give parallel workers separate git worktrees.

When a zstack step names a tool or field Claude Code does not have, drop that field and say so. Never pass a value the tool schema rejects.

## Paths

- Skills: `~/.claude/skills/<name>/SKILL.md`
- Agent prompts: `~/.claude/agents/`
- Source files: use the local zstack checkout. Give the local path when the user needs a link.

For the full Pi-native delegation flow, see [Pi](./pi.md).
