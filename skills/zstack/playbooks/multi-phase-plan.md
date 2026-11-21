### Multi-phase or multi-PR plan

**You own the plan, not the code. The plan is an OpenSpec change folder an owner runs task by task and the operator audits from the evidence.** The plan is the deliverable. Do not implement.

1. When the change is one or two files with an obvious approach, skip the plan. Say so and stop.
2. Settle open questions by prototype before you write, per `playbooks/prototype.md`. Ask the operator only about a product or preference call that no run can settle.
3. Write the plan with the **spec-first** skill. It owns the `openspec/changes/<slug>/` folder, the artifact templates, validation, and the CLI resolution.
4. Put the PR sequence in the plan. Open `design.md` with what changes and the PR ids in landing order, plus the dependency graph, which says which PRs are independent and branch from trunk, which wait for which, and the files each may touch. Then one section per PR. One PR is one change with its own evidence (the **sequence-verifiable-units** principle skill).
5. Put the audit boxes in `tasks.md`. Each PR section carries checkboxes for what it depends on, the files it edits, the one change it builds, the result you see, and its verification. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Each live box drives the real surface with a concrete scenario and a pass predicate. The perf box names the metric, the probe, the trunk baseline measured first, and the number that fails. A PR that changes an interaction waits for the operator's review before merge.
6. Run `openspec validate <slug> --strict`, commit the folder, and in an Antigonus repository append the plan Checkpoint through **antigonus-ops**.
7. Hand back the plan path, the commit SHA, and the PR ids with their dependencies and the review-gated set. Stop. Execution starts on the operator's explicit go.

**Reply:** the plan path, the commit SHA, the PR ids with their dependencies and the review-gated set, and what stays unproven.
