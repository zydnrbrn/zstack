import * as path from "node:path";
import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { discoverAgents, repoRootPath, zstackSkillPath } from "./agents.ts";
import { configPath, readConfig, resolveRoleModel, ROLES, type Role } from "./config.ts";
import { runTask, type DispatchDetails, type TaskRequest, type TaskResult } from "./dispatch.ts";
import { runSetup } from "./setup.ts";

const AgentType = StringEnum(["zstack-agent", "comment-sicko", "generalPurpose", "Explore"] as const, {
	default: "zstack-agent",
});
const RoleType = StringEnum(ROLES, { description: "Role whose model override should be used" });

const TaskItem = Type.Object({
	subagent_type: Type.Optional(AgentType),
	prompt: Type.String({ description: "Task for this worker" }),
	role: Type.Optional(RoleType),
	worktree: Type.Optional(Type.Boolean()),
});

const TaskParams = Type.Object({
	subagent_type: Type.Optional(AgentType),
	agent: Type.Optional(Type.String({ description: "Alias for subagent_type" })),
	prompt: Type.Optional(Type.String({ description: "Task to delegate" })),
	task: Type.Optional(Type.String({ description: "Alias for prompt" })),
	description: Type.Optional(Type.String()),
	role: Type.Optional(RoleType),
	model: Type.Optional(Type.String({ description: "Explicit model, inherit-parent, or auto" })),
	readonly: Type.Optional(Type.Boolean({ description: "Use read-only tools in the child" })),
	run_in_background: Type.Optional(Type.Boolean({ description: "Accepted for playbook compatibility; parallel calls run concurrently" })),
	worktree: Type.Optional(Type.Boolean({ description: "Run the child in a detached git worktree" })),
	resume: Type.Optional(Type.String({ description: "Prior agent report to include as context" })),
	file_attachments: Type.Optional(Type.Array(Type.String())),
	tasks: Type.Optional(Type.Array(TaskItem, { description: "Parallel workers in one call" })),
});

type TaskInput = {
	subagent_type?: string;
	agent?: string;
	prompt?: string;
	task?: string;
	description?: string;
	role?: Role;
	model?: string;
	readonly?: boolean;
	run_in_background?: boolean;
	worktree?: boolean;
	resume?: string;
	file_attachments?: string[];
	tasks?: Array<{ subagent_type?: string; prompt: string; role?: Role; worktree?: boolean }>;
};

function summarize(results: TaskResult[]): string {
	if (results.length === 1) {
		const result = results[0];
		const prefix = result.status === "completed" ? "" : `[${result.status}] `;
		const tree = result.worktree ? `\n\nworktree: ${result.worktree}` : "";
		return `${prefix}${result.text}${tree}`;
	}
	const succeeded = results.filter((result) => result.status === "completed").length;
	return [
		`${succeeded}/${results.length} workers completed`,
		...results.map((result) => `### ${result.agent} (${result.status})\n${result.text}`),
	].join("\n\n");
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "zstack_task",
		label: "Zstack subagent",
		description: [
			"Delegate a task to a zstack subagent in an isolated Pi process.",
			"Use subagent_type zstack-agent for playbook workers, comment-sicko for comment review, generalPurpose or Explore for generic work.",
			"Every role inherits the parent model unless /setup-zstack records an override or the caller names a model.",
			"Call this tool several times in one message to run workers in parallel.",
		].join(" "),
		promptSnippet: "Delegate work to an isolated zstack subagent",
		promptGuidelines: [
			"Use zstack_task for every playbook subagent spawn in zstack skills.",
			"Use subagent_type comment-sicko only for /no-comments.",
			"Pass file paths in the prompt instead of pasting file contents.",
		],
		parameters: TaskParams,

		prepareArguments(args) {
			const input = (args ?? {}) as TaskInput;
			const next: TaskInput = { ...input };
			if (!next.subagent_type && next.agent) next.subagent_type = next.agent;
			if (!next.prompt && next.task) next.prompt = next.task;
			if (!next.subagent_type) next.subagent_type = "zstack-agent";
			return next as never;
		},

		async execute(_toolCallId, rawParams, signal, onUpdate, ctx) {
			const params = rawParams as TaskInput;
			const config = await readConfig();
			const agents = discoverAgents();
			const prompt = params.prompt ?? params.task ?? "";
			if (!prompt && !(params.tasks?.length ?? 0)) {
				return {
					content: [{ type: "text", text: "zstack_task needs a prompt or a tasks array." }],
					details: { tasks: [], isError: true } satisfies DispatchDetails,
					isError: true,
				};
			}

			const emit = (text: string) => onUpdate?.({ content: [{ type: "text", text }], details: { tasks: [], isError: false } satisfies DispatchDetails });

			const requests: TaskRequest[] = params.tasks?.length
				? params.tasks.map((item) => ({
						subagent_type: item.subagent_type ?? "zstack-agent",
						prompt: item.prompt,
						role: item.role,
						worktree: item.worktree,
						readonly: params.readonly,
					}))
				: [{
						subagent_type: params.subagent_type ?? "zstack-agent",
						prompt,
						description: params.description,
						role: params.role,
						model: params.model,
						readonly: params.readonly,
						worktree: params.worktree,
						resume: params.resume,
						file_attachments: params.file_attachments,
					}];

			const results: TaskResult[] = [];
			for (const request of requests) {
				const role = request.role ?? (request.subagent_type === "comment-sicko" ? "judgment and prose" : "feature, refactoring");
				const model = resolveRoleModel(role as Role, request.model, config);
				results.push(await runTask(pi, ctx, agents, request, model, signal, emit));
			}

			const isError = results.some((result) => result.status !== "completed");
			return {
				content: [{ type: "text", text: summarize(results) }],
				details: { tasks: results, isError } satisfies DispatchDetails,
				isError,
			};
		},

		renderCall(args, theme) {
			const input = args as TaskInput;
			const count = input.tasks?.length ?? 1;
			const label = count === 1 ? (input.subagent_type ?? input.agent ?? "zstack-agent") : `${count} workers`;
			return new Text(theme.fg("toolTitle", theme.bold("zstack_task ")) + theme.fg("accent", label), 0, 0);
		},

		renderResult(result, { expanded }, theme) {
			const details = result.details as DispatchDetails | undefined;
			const first = details?.tasks[0];
			if (!first) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "(no output)", 0, 0);
			}
			const icon = first.status === "completed" ? theme.fg("success", "✓") : theme.fg("error", "✗");
			let line = `${icon} ${theme.fg("toolTitle", theme.bold(first.agent))}`;
			if (details && details.tasks.length > 1) line += theme.fg("muted", ` (${details.tasks.length} workers)`);
			if (!expanded) return new Text(line, 0, 0);
			return new Text(`${line}\n${theme.fg("dim", summarize(details?.tasks ?? []))}`, 0, 0);
		},
	});

	const skillCommand = (name: string, description: string) => {
		pi.registerCommand(name, {
			description,
			handler: async (args, ctx) => {
				const suffix = args.trim() ? ` ${args.trim()}` : "";
				pi.sendUserMessage(`/skill:${name}${suffix}`, { expandPromptTemplates: true });
			},
		});
	};

	skillCommand("zstack", "Start a zstack task with a goal and playbook routing");
	skillCommand("zstack-help", "Ask which zstack skill, playbook, or principle fits");

	pi.registerCommand("setup-zstack", {
		description: "Configure per-role zstack models globally (~/.pi/agent/zstack.json)",
		handler: async (_args, ctx) => {
			await runSetup(ctx);
		},
	});

	pi.registerCommand("zstack-status", {
		description: "Show where zstack is installed and which model roles are overridden",
		handler: async (_args, ctx) => {
			const config = await readConfig();
			const overrides = Object.entries(config.roles);
			const agents = discoverAgents().map((agent) => agent.name).join(", ");
			ctx.ui.notify(
				`zstack root: ${repoRootPath()}\nskill: ${zstackSkillPath()}\nconfig: ${configPath()}\nagents: ${agents}\noverrides: ${overrides.length ? overrides.map(([role, model]) => `${role}=${model}`).join(", ") : "none (inherit-parent)"}\nskills for Codex, Grok, Claude Code: ~/.agents/skills and ~/.claude/skills`,
				"info",
			);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.setStatus("zstack", "zstack");
	});
}
