import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export interface AntigonusEntry {
	project?: string;
	issue?: string;
}

export interface AntigonusMap {
	repos?: Record<string, AntigonusEntry>;
}

export interface ResolvedAntigonusEntry {
	source: "machine" | "repository";
	entry: AntigonusEntry;
	key?: string;
}

export function antigonusMapPath(): string {
	return join(getAgentDir(), "antigonus.json");
}

export function antigonusOverridePath(repoRoot: string): string {
	return join(repoRoot, ".zstack", "antigonus.json");
}

export function defaultAntigonusMap(): AntigonusMap {
	return { repos: {} };
}

export async function readAntigonusMap(path: string = antigonusMapPath()): Promise<AntigonusMap> {
	try {
		const raw = await readFile(path, "utf8");
		const parsed = JSON.parse(raw) as { repos?: unknown };
		if (typeof parsed !== "object" || parsed === null || typeof parsed.repos !== "object" || parsed.repos === null) {
			return defaultAntigonusMap();
		}
		const repos: Record<string, AntigonusEntry> = {};
		for (const [key, value] of Object.entries(parsed.repos as Record<string, unknown>)) {
			if (typeof value !== "object" || value === null) continue;
			const entry = value as Record<string, unknown>;
			const project = typeof entry.project === "string" && entry.project.trim() ? entry.project.trim() : undefined;
			const issue = typeof entry.issue === "string" && entry.issue.trim() ? entry.issue.trim() : undefined;
			if (project || issue) repos[resolve(key)] = { project, issue };
		}
		return { repos };
	} catch {
		return defaultAntigonusMap();
	}
}

export async function writeAntigonusMap(map: AntigonusMap, path: string = antigonusMapPath()): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify({ repos: map.repos ?? {} }, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
}

export async function readAntigonusOverride(repoRoot: string): Promise<AntigonusEntry | null> {
	try {
		const raw = await readFile(antigonusOverridePath(repoRoot), "utf8");
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const project = typeof parsed.project === "string" && parsed.project.trim() ? parsed.project.trim() : undefined;
		const issue = typeof parsed.issue === "string" && parsed.issue.trim() ? parsed.issue.trim() : undefined;
		return project || issue ? { project, issue } : null;
	} catch {
		return null;
	}
}

export function findMappedEntry(
	map: AntigonusMap,
	repoRoot: string,
): { key: string; entry: AntigonusEntry } | null {
	const root = resolve(repoRoot);
	let best: { key: string; entry: AntigonusEntry } | null = null;
	for (const [key, entry] of Object.entries(map.repos ?? {})) {
		const candidate = resolve(key);
		if (root !== candidate && !root.startsWith(candidate + sep)) continue;
		if (!best || candidate.length > best.key.length) best = { key: candidate, entry };
	}
	return best;
}

export async function resolveAntigonusEntry(
	repoRoot: string,
	mapPath: string = antigonusMapPath(),
): Promise<ResolvedAntigonusEntry | null> {
	const override = await readAntigonusOverride(repoRoot);
	if (override) return { source: "repository", entry: override };
	const map = await readAntigonusMap(mapPath);
	const hit = findMappedEntry(map, repoRoot);
	if (hit) return { source: "machine", entry: hit.entry, key: hit.key };
	return null;
}

export async function registerAntigonusRepo(
	repoRoot: string,
	project: string,
	issue?: string,
	mapPath: string = antigonusMapPath(),
): Promise<void> {
	const map = await readAntigonusMap(mapPath);
	const key = resolve(repoRoot);
	map.repos = { ...(map.repos ?? {}), [key]: { project, issue } };
	await writeAntigonusMap(map, mapPath);
}
