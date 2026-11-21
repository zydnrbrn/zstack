import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";

export interface AgentConfig {
	name: string;
	description: string;
	tools?: string[];
	systemPrompt: string;
	filePath: string;
	source: "bundled" | "user";
}

type AgentFrontmatter = {
	name?: unknown;
	description?: unknown;
	tools?: unknown;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bundledAgentsDir = path.join(repoRoot, "agents");
const userAgentsDir = path.join(getAgentDir(), "agents");

function parseToolList(value: unknown): string[] | undefined {
	const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
	const tools = raw
		.filter((item): item is string => typeof item === "string")
		.map((item) => item.trim())
		.filter(Boolean);
	return tools.length > 0 ? tools : undefined;
}

function loadDir(dir: string, source: AgentConfig["source"]): AgentConfig[] {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	const agents: AgentConfig[] = [];
	for (const entry of entries) {
		if (!entry.name.endsWith(".md") || (!entry.isFile() && !entry.isSymbolicLink())) continue;
		const filePath = path.join(dir, entry.name);
		let content: string;
		try {
			content = fs.readFileSync(filePath, "utf8");
		} catch {
			continue;
		}
		const { frontmatter, body } = parseFrontmatter<AgentFrontmatter>(content);
		if (typeof frontmatter.name !== "string" || typeof frontmatter.description !== "string") continue;
		agents.push({
			name: frontmatter.name,
			description: frontmatter.description,
			tools: parseToolList(frontmatter.tools),
			systemPrompt: body.trim(),
			filePath,
			source,
		});
	}
	return agents;
}

export function discoverAgents(): AgentConfig[] {
	const byName = new Map<string, AgentConfig>();
	for (const agent of loadDir(userAgentsDir, "user")) byName.set(agent.name, agent);
	for (const agent of loadDir(bundledAgentsDir, "bundled")) byName.set(agent.name, agent);
	return [...byName.values()];
}

export function zstackSkillPath(): string {
	return path.join(repoRoot, "skills", "zstack", "SKILL.md");
}

export function repoRootPath(): string {
	return repoRoot;
}
