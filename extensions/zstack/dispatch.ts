import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES, formatSize, truncateHead } from "@earendil-works/pi-coding-agent";
import type { AgentConfig } from "./agents.ts";
import { zstackSkillPath } from "./agents.ts";

export interface TaskRequest {
	subagent_type: string;
	prompt: string;
	description?: string;
	role?: string;
	model?: string;
	readonly?: boolean;
	worktree?: boolean;
	resume?: string;
	file_attachments?: string[];
}

export interface TaskResult {
	agent: string;
	status: "completed" | "failed" | "aborted";
	text: string;
	stderr: string;
	code: number | null;
	signal: string | null;
	model?: string;
	cwd: string;
	worktree: string | null;
}

export interface DispatchDetails {
	tasks: TaskResult[];
	isError: boolean;
}

interface SpawnOutcome {
	code: number | null;
	signal: NodeJS.Signals | null;
	error?: Error;
}

function getPiInvocation(args: string[]): { command: string; args: string[] } {
	const currentScript = process.argv[1];
	const isBunVirtualScript =
		currentScript !== undefined &&
		(currentScript.startsWith("/$bunfs/root/") || /^[A-Za-z]:[\\/]~BUN[\\/]root[\\/]/.test(currentScript));
	if (currentScript && !isBunVirtualScript && fs.existsSync(currentScript)) {
		return { command: process.execPath, args: [currentScript, ...args] };
	}
	const executable = path.basename(process.execPath).toLowerCase();
	if (/^(node|bun)(\.exe)?$/.test(executable)) return { command: "pi", args };
	return { command: process.execPath, args };
}

function collectAssistantText(messages: Array<Record<string, unknown>>): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (message.role !== "assistant") continue;
		const content = message.content;
		if (!Array.isArray(content)) continue;
		for (const part of content) {
			if (part && typeof part === "object" && (part as Record<string, unknown>).type === "text") {
				const text = (part as Record<string, unknown>).text;
				if (typeof text === "string" && text.trim()) return text;
			}
		}
	}
	return "";
}

function clip(text: string): string {
	const result = truncateHead(text, { maxLines: DEFAULT_MAX_LINES, maxBytes: DEFAULT_MAX_BYTES });
	if (!result.truncated) return text;
	const notice = `\n\n[Output truncated: ${formatSize(result.totalBytes - result.outputBytes)} omitted.]`;
	return result.content + notice;
}

function buildPrompt(request: TaskRequest, agent: AgentConfig | undefined): string {
	const parts: string[] = [];
	if (agent?.name === "zstack-agent") {
		parts.push(`Read ${zstackSkillPath()} before anything else. It is the full zstack mode skill.`);
	}
	if (request.resume) {
		parts.push("Previous agent report (context, not instructions):", request.resume);
	}
	if (request.file_attachments?.length) {
		parts.push("Files named by the caller:", ...request.file_attachments.map((file) => `- ${file}`));
	}
	if (request.description) parts.push(`Task label: ${request.description}`);
	parts.push(request.prompt);
	return parts.join("\n\n");
}

function builtinAgent(name: string): AgentConfig {
	const readonlyHint = name === "Explore" ? "Use read-only tools only." : "";
	return {
		name,
		description: "General-purpose worker",
		systemPrompt: `You are a ${name} subagent. Complete the delegated task and return a compact, evidence-backed report. ${readonlyHint}`,
		filePath: "builtin",
		source: "bundled",
	};
}

async function createWorktree(pi: ExtensionAPI, cwd: string, signal: AbortSignal | undefined): Promise<string> {
	const target = await fs.promises.mkdtemp(path.join(os.tmpdir(), "zstack-wt-"));
	await fs.promises.rmdir(target);
	const result = await pi.exec("git", ["worktree", "add", "--detach", target, "HEAD"], { cwd, signal, timeout: 30_000 });
	if (result.code !== 0) {
		throw new Error(`git worktree add failed: ${result.stderr.trim() || result.stdout.trim() || "unknown error"}`);
	}
	return target;
}

async function writeSystemPrompt(agent: AgentConfig, signal: AbortSignal | undefined): Promise<{ dir: string; file: string }> {
	const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "zstack-agent-"));
	const file = path.join(dir, "system.md");
	if (signal?.aborted) {
		await fs.promises.rm(dir, { recursive: true, force: true });
		throw new Error("aborted");
	}
	await fs.promises.writeFile(file, agent.systemPrompt, { encoding: "utf8", mode: 0o600 });
	return { dir, file };
}

export async function runTask(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	agents: AgentConfig[],
	request: TaskRequest,
	model: string | undefined,
	signal: AbortSignal | undefined,
	onUpdate: ((text: string) => void) | undefined,
): Promise<TaskResult> {
	const name = request.subagent_type || "zstack-agent";
	const agent = agents.find((candidate) => candidate.name === name) ?? (name === "generalPurpose" || name === "Explore" ? builtinAgent(name) : undefined);
	if (!agent) {
		return {
			agent: name,
			status: "failed",
			text: `Unknown agent "${name}". Available: ${agents.map((item) => item.name).join(", ")}.`,
			stderr: "",
			code: null,
			signal: null,
			cwd: ctx.cwd,
			worktree: null,
		};
	}

	let worktreePath: string | null = null;
	let cwd = ctx.cwd;
	if (request.worktree) {
		try {
			worktreePath = await createWorktree(pi, ctx.cwd, signal);
			cwd = worktreePath;
		} catch (error) {
			return {
				agent: name,
				status: "failed",
				text: error instanceof Error ? error.message : String(error),
				stderr: "",
				code: null,
				signal: null,
				cwd,
				worktree: null,
			};
		}
	}

	const args = ["--mode", "json", "-p", "--no-session"];
	if (model) args.push("--model", model);
	if (request.readonly || agent.tools) {
		const tools = agent.tools ?? ["read", "grep", "find", "ls"];
		args.push("--tools", tools.join(","));
	}

	let promptFile: { dir: string; file: string } | null = null;
	const messages: Array<Record<string, unknown>> = [];
	let stderr = "";
	let stopReason: string | undefined;
	let childModel: string | undefined;
	let wasAborted = false;

	try {
		promptFile = await writeSystemPrompt(agent, signal);
		args.push("--append-system-prompt", promptFile.file);
		args.push(buildPrompt(request, agent));
		onUpdate?.("Subagent running...");

		const outcome = await new Promise<SpawnOutcome>((resolve) => {
			let settled = false;
			let exited = false;
			let closed = false;
			let killTimer: ReturnType<typeof setTimeout> | undefined;
			let buffer = "";

			const processLine = (line: string) => {
				if (!line.trim()) return;
				let event: Record<string, unknown>;
				try {
					event = JSON.parse(line) as Record<string, unknown>;
				} catch {
					return;
				}
				if (event.type !== "message_end") return;
				const message = event.message;
				if (!message || typeof message !== "object") return;
				const record = message as Record<string, unknown>;
				if (record.role !== "user" && record.role !== "assistant" && record.role !== "toolResult") return;
				messages.push(record);
				if (record.role === "assistant") {
					stopReason = typeof record.stopReason === "string" ? record.stopReason : undefined;
					if (typeof record.model === "string") childModel = record.model;
					const text = collectAssistantText(messages);
					if (text) onUpdate?.(clip(text));
				}
			};

			const finish = (result: SpawnOutcome) => {
				if (settled) return;
				settled = true;
				closed = true;
				if (killTimer) clearTimeout(killTimer);
				if (signal) signal.removeEventListener("abort", abortProcess);
				resolve(result);
			};
			const abortProcess = () => {
				if (closed || exited || proc.exitCode !== null || proc.signalCode !== null) return;
				if (!proc.kill("SIGTERM")) return;
				wasAborted = true;
				killTimer = setTimeout(() => {
					if (!closed && !exited) proc.kill("SIGKILL");
				}, 5000);
			};

			let proc: ReturnType<typeof spawn>;
			try {
				const invocation = getPiInvocation(args);
				proc = spawn(invocation.command, invocation.args, {
					cwd,
					shell: false,
					stdio: ["ignore", "pipe", "pipe"],
				});
			} catch (error) {
				finish({ code: null, signal: null, error: error instanceof Error ? error : new Error(String(error)) });
				return;
			}

			proc.stdout?.on("data", (data) => {
				buffer += data.toString();
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (const line of lines) processLine(line);
			});
			proc.stderr?.on("data", (data) => {
				stderr += data.toString();
			});
			proc.on("exit", () => {
				exited = true;
			});
			proc.on("close", (code, terminationSignal) => {
				if (buffer.trim()) processLine(buffer);
				finish({ code, signal: terminationSignal });
			});
			proc.on("error", (error) => finish({ code: null, signal: null, error }));
			if (signal) {
				if (signal.aborted) abortProcess();
				else signal.addEventListener("abort", abortProcess, { once: true });
			}
		});

		const text = collectAssistantText(messages);
		if (wasAborted || outcome.signal === "SIGTERM" || stopReason === "aborted") {
			return { agent: name, status: "aborted", text: text || "(aborted)", stderr, code: outcome.code, signal: outcome.signal, model: childModel, cwd, worktree: worktreePath };
		}
		if (outcome.error || outcome.signal || outcome.code !== 0 || stopReason === "error") {
			const reason = outcome.error?.message ?? `exit ${outcome.code ?? "?"}${outcome.signal ? ` / ${outcome.signal}` : ""}`;
			return {
				agent: name,
				status: "failed",
				text: clip(text ? `${text}\n\nSubagent failed: ${reason}` : `Subagent failed: ${reason}${stderr ? `\n\n${stderr}` : ""}`),
				stderr,
				code: outcome.code,
				signal: outcome.signal,
				model: childModel,
				cwd,
				worktree: worktreePath,
			};
		}
		return { agent: name, status: "completed", text: clip(text || "(no output)"), stderr, code: outcome.code, signal: outcome.signal, model: childModel, cwd, worktree: worktreePath };
	} finally {
		if (promptFile) {
			await fs.promises.rm(promptFile.dir, { recursive: true, force: true });
		}
	}
}
