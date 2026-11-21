# Tasks

## 1. Planning Scaffold

- [x] 1.1 Add `openspec/config.yaml` pinning `schema: spec-driven` and verify `openspec context --json` resolves the zstack repository root
- [x] 1.2 Verify `openspec validate spec-first-plan-gate --strict` passes on this committed plan

## 2. Generic Planning Skill

- [x] 2.1 Write `skills/spec-first/SKILL.md` covering the change-folder contract, CLI resolution and degradation, the planning boundary, and the approval handoff, then verify its frontmatter parses and every relative link resolves
- [x] 2.2 Reference `spec-first` from `skills/zstack/SKILL.md` and verify the link resolves from the installed skill path

## 3. Antigonus Governance Skill

- [x] 3.1 Write `skills/antigonus-ops/SKILL.md` covering live OPS resolution, repo-to-Project resolution, session start, Progress event protocol, Issue transitions, handoff, and failure handling, then verify `rg -i svgarpyle skills/antigonus-ops` returns nothing
- [x] 3.2 Add the map loader and `/antigonus-register` command to `extensions/zstack`, writing `~/.pi/agent/antigonus.json`, and verify a dry run resolves the Svgarpyle repository path to its Project URL without writing to Notion

## 4. Gate Wiring

- [x] 4.1 Add the planning gate to the non-negotiables in `skills/zstack/SKILL.md`, naming the Investigation, read-only, one-line, and local-command exemptions, and verify every playbook route is covered by the gate text
- [x] 4.2 Rewrite `skills/zstack/playbooks/multi-phase-plan.md` to emit the OpenSpec change folder through `spec-first`, and verify its links resolve
- [x] 4.3 Point the Records section of `skills/zstack-lead/SKILL.md` at `antigonus-ops` for the live protocol, and verify the link resolves

## 5. Documentation

- [x] 5.1 Add a plan-first page to `docs/guide/` and link it from `docs/guide/README.md`, verifying every new link resolves
- [x] 5.2 Update `README.md` and `docs/harness/pi.md` for the gate, exemptions, and repo map, verifying every new link resolves
- [x] 5.3 Run `/unslop` and `/technical-writing` over the changed prose, then re-run the link check

## 6. Consolidation

- [x] 6.1 Reduce `clients/svgarpyle-workspace/svgarpyle/.agents/skills/notion-operations/SKILL.md` to a pointer at `antigonus-ops` plus its local source links, verifying every remaining link resolves
- [x] 6.2 Verify no zstack skill, doc, or extension file references Svgarpyle

## 7. Evidence

- [x] 7.1 Run the eval playbook blind on this skill change, same task for both variants, and attach the judge report to the PR
- [x] 7.2 Append a Verification event for the completed gate change with the branch SHA, exact commands, observed results, and unverified gaps, then read the Progress Tracker row back and confirm it matches

## Workflow follow-up

- Open a PR through the Opening a PR playbook.
- Archive `spec-first-plan-gate` after merge and verify `openspec/specs/change-planning/spec.md`.
