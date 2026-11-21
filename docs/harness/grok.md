# zstack in Grok

Grok reads zstack skills from `~/.agents/skills/` and `~/.grok/skills/`. The machine-wide link created at install time makes every skill available in every project. No repository config is needed.

Invoke skills by their slash names, for example `/zstack`, `/how`, or `/interrogate`. Grok also reads `~/.grok/agents/` for agent prompts; link `agents/zstack-agent.md` and `agents/comment-sicko.md` there if you want named agents.

Grok has its own subagent support. Map the zstack playbook's `zstack-agent` role to a worker that receives the absolute path to `skills/zstack/SKILL.md` and reads it before any work. Use `comment-sicko` only for `/no-comments`. Keep every role on the session model unless you deliberately choose an override.

Grok Bot webhook routines are unrelated to zstack's removed automation pack. The `/make-bot-ui` skill still builds a local page that wakes a bot over a webhook. See [Pi](./pi.md) for the full native delegation flow.
