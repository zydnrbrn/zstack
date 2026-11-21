import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { INHERIT, readConfig, ROLES, writeConfig, type Role } from "./config.ts";

export async function runSetup(ctx: ExtensionContext): Promise<void> {
	const config = await readConfig();
	const overrides = Object.entries(config.roles).filter(([, value]) => value && value !== INHERIT && value !== "auto");
	if (!ctx.hasUI) {
		ctx.ui.notify(
			overrides.length === 0
				? "zstack: every role inherits the parent model. Config: ~/.pi/agent/zstack.json"
				: `zstack overrides: ${overrides.map(([role, value]) => `${role}=${value}`).join(", ")}. Config: ~/.pi/agent/zstack.json`,
			"info",
		);
		return;
	}

	const action = await ctx.ui.select("zstack model setup", [
		"Keep every role on inherit-parent (recommended)",
		"Set or clear one role override",
		"Reset all overrides",
	]);
	if (!action) return;

	if (action !== "Set or clear one role override") {
		await writeConfig({ version: 1, roles: {} });
		ctx.ui.notify("zstack config saved. Every role inherits the parent model.", "info");
		return;
	}

	const role = await ctx.ui.select("Role", [...ROLES]);
	if (!role) return;

	const available = ctx.modelRegistry.getAvailable();
	const choices = ["inherit-parent", ...available.map((model) => `${model.provider}/${model.id}`)];
	const selected = await ctx.ui.select(`${role} model`, choices);
	if (!selected) return;

	const next = { ...config.roles };
	if (selected === INHERIT) delete next[role as Role];
	else next[role as Role] = selected;
	await writeConfig({ version: 1, roles: next });
	ctx.ui.notify(
		selected === INHERIT ? `${role} now inherits the parent model.` : `${role} now uses ${selected}.`,
		"info",
	);
}
