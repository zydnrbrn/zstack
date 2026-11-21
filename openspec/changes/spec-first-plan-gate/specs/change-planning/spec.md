# Spec Delta

## Purpose

Defines how zstack plans work, gates implementation on human approval, and keeps the local plan and the Notion progress trail aligned.

## ADDED Requirements

### Requirement: Local plan artifacts

zstack SHALL write an OpenSpec-compatible change folder in the repository before implementation. The folder SHALL contain `proposal.md`, `design.md`, `tasks.md`, and delta specs, unless the change declares `skip_specs: true`.

#### Scenario: Feature request plans locally

- **WHEN** an operator requests a feature in a mapped Antigonus repository
- **THEN** zstack creates `openspec/changes/<slug>/` with proposal, design, tasks, and delta specs before editing product code

#### Scenario: Pure refactor skips specs

- **WHEN** a change has no spec-level behavior change
- **THEN** its `.openspec.yaml` sets `skip_specs: true` and the folder still carries proposal, design, and tasks

### Requirement: Approval gate

zstack SHALL stop after presenting the plan and SHALL NOT start implementation until the operator explicitly approves. Read-only investigations, one-line fixes, and local command runs are exempt.

#### Scenario: Plan waits for approval

- **WHEN** zstack finishes the plan checkpoint
- **THEN** it stops, names the approval action, and leaves product code unchanged

#### Scenario: Approval unlocks execution

- **WHEN** the operator replies with approval
- **THEN** zstack appends a Decision event referencing the checkpoint and begins implementation

#### Scenario: One-line fix is exempt

- **WHEN** the request is a one-line fix or a local check, test, or command run
- **THEN** zstack proceeds without a plan folder, plan checkpoint, or approval stop

### Requirement: Notion progress events

zstack SHALL append Progress Tracker events only for implementation progress and material transitions. Events SHALL follow OPS-08 fields and SHALL relate to the resolved Project and Issue when known.

#### Scenario: Plan checkpoint

- **WHEN** the local plan is committed to the working branch
- **THEN** zstack appends a Checkpoint event with Result `Unverified`, the plan path, the commit SHA, and a next action that requests approval

#### Scenario: Verification evidence

- **WHEN** implementation reaches a verified state
- **THEN** zstack appends a Verification event with exact commands, observed results, environment, and remaining unverified gaps

#### Scenario: Routine local work stays silent

- **WHEN** zstack investigates code, runs checks, or runs tests
- **THEN** it does not append a Progress event

### Requirement: Repo-to-Project resolution

zstack SHALL resolve the repository to a Notion Project from `~/.pi/agent/antigonus.json` or a per-repo `.zstack/antigonus.json`. If neither maps the repo, zstack SHALL ask once and save the answer.

#### Scenario: Mapped repository

- **WHEN** the current repository path is present in the machine map
- **THEN** zstack uses that Project URL without asking

#### Scenario: Unmapped repository

- **WHEN** the current repository path is absent from both maps
- **THEN** zstack asks for the Project once and writes the machine map

### Requirement: Live governance documents

`antigonus-ops` SHALL fetch the current OPS-00, OPS-01, OPS-02, OPS-04, and OPS-08 pages from Notion at session start. It SHALL NOT copy their text into zstack skills or hardcode client-specific details.

#### Scenario: Latest protocol wins

- **WHEN** an OPS document changes in Notion
- **THEN** the next zstack session follows the updated document without a zstack release

### Requirement: Single Notion writer

Only the parent lead SHALL write to Notion. zstack workers SHALL NOT append Progress events or update Issues.

#### Scenario: Worker reports evidence

- **WHEN** a delegated worker completes a task
- **THEN** it returns evidence to the lead, and the lead owns the Notion write

### Requirement: Consolidation

Repository-local Notion operation skills SHALL reference `antigonus-ops` rather than duplicate its protocol. Client-specific sources stay in the repository's own docs.

#### Scenario: Repository pointer

- **WHEN** an agent reads a repository-local Notion operations skill
- **THEN** it points to the shared `antigonus-ops` skill and keeps only that repository's source links
