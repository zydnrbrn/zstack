import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const ROLES = [
	"feature, refactoring",
	"bug-fix",
	"perf-issue",
	"hillclimb",
	"judgment and prose",
	"arena runners",
	"arena cross-judge pool",
	"swarm workers",
	"interrogate reviewers",
] as const;

export type Role = (typeof ROLES)[number];

export interface ZstackConfig {
	version: 1;
	roles: Partial<Record<Role, string>>;
}

export const INHERIT = "inherit-parent";

export function configPath(): string {
	return join(getAgentDir(), "zstack.json");
}

export function defaultConfig(): ZstackConfig {
	return { version: 1, roles: {} };
}

export async function readConfig(): Promise<ZstackConfig> {
	try {
		const raw = await readFile(configPath(), "utf8");
		const parsed = JSON.parse(raw) as { version?: unknown; roles?: unknown };
		if (parsed.version !== 1 || typeof parsed.roles !== "object" || parsed.roles === null) {
			return defaultConfig();
		}
		const roles: Partial<Record<Role, string>> = {};
		for (const role of ROLES) {
			const value = (parsed.roles as Record<string, unknown>)[role];
			if (typeof value === "string" && value.trim()) roles[role] = value.trim();
		}
		return { version: 1, roles };
	} catch {
		return defaultConfig();
	}
}

export async function writeConfig(config: ZstackConfig): Promise<void> {
	const path = configPath();
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify({ version: 1, roles: config.roles }, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
}

export function resolveRoleModel(role: Role | undefined, override: string | undefined, config: ZstackConfig): string | undefined {
	const candidate = override ?? (role ? config.roles[role] : undefined);
	if (!candidate || candidate === INHERIT || candidate === "auto") return undefined;
	return candidate;
}
