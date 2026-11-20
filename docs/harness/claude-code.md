# zstack in Claude Code

zstack skills use upstream tool names. In a T3 Claude Code session, read this file once per session, then map each upstream name in a skill with the tables below. `<zstack>` means the folder that holds `skills/` and `docs/`. If an upstream field has no row, drop it and say so. Never pass a field or value the tool schema rejects. Cursor is not a supported harness.

## Tools

| Upstream name | Claude Code in T3 |
| --- | --- |
| `Task` | `Agent` |
| `AskQuestion` | `AskUserQuestion`. In `-p` mode it is absent, so ask in plain text. |
| Open a todolist, or copy steps into the todolist tool | Use `TodoWrite` if the session offers it. Otherwise keep the list in your reply and update it at each phase. |
| Run another zstack skill (`/name` or "the **name** skill") | `Read` `<zstack>/skills/<name>/SKILL.md` and follow it. The `Skill` tool refuses most zstack skills. When you tell the user to type it, write `/zstack:<name>`. |
| `Grep`, `Glob` | `Bash` with `rg` when the session has no `Grep` or `Glob`. |

## Subagent fields

| Upstream field | Claude Code in T3 |
| --- | --- |
| `subagent_type: generalPurpose` | `subagent_type: "general-purpose"` |
| `zstack-agent`, `comment-sicko` | `zstack:zstack-agent`, `zstack:comment-sicko` |
| Every zstack worker model | Defaults to `inherit-parent`. Omit `model` and `effort` on `Agent` calls so the worker uses the session model. Only an explicit user override is mapped with the Models table. |
| `readonly: true` | `subagent_type: "Explore"`. It keeps `Bash`, so the brief also says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | `general-purpose`. It keeps the session's MCP servers. |
| `run_in_background: true` | Omit. Subagents run in the background by default and notify you when they finish. |
| `resume` | Spawn a new agent and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |
| Cloud subagent fields | not supported. Cursor is not a supported harness. |

Use an isolated worktree when parallel agents need separate working trees.

## Models

| Upstream name | Claude Code in T3 |
| --- | --- |
| `inherit-parent` or `auto` | Omit `model` and `effort`. These are the defaults for every role, so workers use the session model. |
| A user-chosen `claude-<family>-<version>-<effort>` slug | `model: "<family>"` and `effort: "<effort>"`. `model` takes only `opus`, `sonnet`, `haiku`, `fable`. Drop `-fast`. |
| A non-Claude slug | Omit `model` so the agent runs on the session model, and say so. |
| The repository-root `zstack-models.md` rule | Skills read it from the root of the repository being configured. If the file or the role's line is missing, the default is `inherit-parent`: omit `model`. |
| A role value `<model> <effort>`, such as `opus high` | `model: "opus"` and `effort: "high"`. |

## setup-zstack

Follow `setup-zstack` with these changes. The model rule is a repository file, not a session-wide configuration file.

- Detect. The detected models are the `model` values that the `Agent` tool schema lists, each with an effort from its `effort` values. Write an explicit override as `<model> <effort>`, such as `opus xhigh`. No real slug is needed for the defaults.
- Defaults. Every role is `inherit-parent`, so omit `model` and `effort`. A re-run never rewrites a role to a named model family.
- Write. Write `zstack-models.md` at the root of the repository being configured, with the comment lines and one line per role from step 5. Overwrite the whole file. Never put the role lines in `CLAUDE.md` or `AGENTS.md`.

## Paths

| Upstream path | Claude Code in T3 |
| --- | --- |
| Project-local skills | `skills/` in the target repository |
| Model rule | `zstack-models.md` at the root of the target repository |
| Source files | `<zstack>/<path>` when that file exists. Read the local copy and never fetch it. Give the local path when the user needs a link. |
| Workspace transcripts | Use the transcript path named by the session. Read only this workspace's folder and its subagent transcripts. |

## Unsupported upstream features

When an upstream step needs an unsupported product, write `not supported. Cursor is not a supported harness.` and continue with the engineering step that does not need it.

| Upstream feature | Claude Code in T3 |
| --- | --- |
| Automation routines, webhooks, and routine wakes | not supported. Cursor is not a supported harness. |
| Automated review comments | Treat them as ordinary review threads and triage them with the forge command that the step gives. |
| Built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. |
