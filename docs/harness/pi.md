# zstack in Pi

Pi workers use the parent session's default model. Leave `model` unset when you spawn a worker; Pi's own default is the source of truth. Do not pass model slugs from another harness to a Pi worker, even if older notes mention them.

Independent review is not a worker role. The T3 session reviews the work, whether that session runs Grok, Codex, Claude Code, or another harness.

## Name and path notes

- The mode skill is `/zstack`; in Claude Code it is `/zstack:zstack`.
- The delegate is `zstack-agent`. Help is `/zstack-help`; setup is `/setup-zstack`.
- When a model rule is needed, `/setup-zstack` writes `zstack-models.md` at the root of the repository being configured. Pi needs no rule file to inherit its session default.
- Every role defaults to `inherit-parent`: workers, panels, judges, and reviewers named in skill defaults. A panel is one `inherit-parent` entry.
