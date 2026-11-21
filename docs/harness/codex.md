# zstack in Codex

Codex reads zstack skills from the user-scope Agent Skills directory `~/.agents/skills/`. The machine-wide link created at install time makes every skill available in every project. No repository config is needed.

Invoke skills by their slash names, for example `/zstack`, `/how`, or `/interrogate`. Most zstack skills are explicit-only; they do not load on their own.

Codex has its own subagent tool. Use it for delegation when a workflow step asks for a worker. Map the zstack playbook's `zstack-agent` role to a worker that receives the absolute path to `skills/zstack/SKILL.md` and reads it before any work. Use `comment-sicko` only for `/no-comments`. Keep every role on the session model unless you deliberately choose an override.

Model overrides written by Pi's `/setup-zstack` apply only to Pi workers. Codex uses its own config.

For the full Pi-native delegation flow, run the same task in Pi. See [Pi](./pi.md).
