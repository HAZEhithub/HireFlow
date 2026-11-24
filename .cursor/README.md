# HireFlow Cursor workspace configuration

This directory contains **project-local** Cursor configuration for HireFlow.

## Scope and isolation
- Project rules: `.cursor/rules/*.mdc`
- Custom subagents: `.cursor/agents/*.md`
- Agent Skills: `.cursor/skills/<skill-name>/SKILL.md`
- Root project instructions: `AGENTS.md`

These files are inside this repository. They do not edit `~/.cursor`, Cursor User Rules, or other repositories. Do not copy these files into a global Cursor configuration.

## Automatic specialist delegation

No manual agent commands are required.

Cursor's main Agent is the orchestrator. It should automatically select HireFlow specialists based on task scope, complexity and each subagent's description. It should delegate matching work without asking the user to choose an agent.

Project specialists:
- `market-researcher`: competitor, product, pricing and market evidence (read-only)
- `product-architect`: requirements, journeys, prioritization and architecture planning (read-only)
- `frontend-engineer`: marketing and application frontend
- `backend-engineer`: APIs, backend services, authentication and integrations
- `ai-ml-engineer`: resume intelligence, matching, LLM/ML and evaluation
- `job-data-engineer`: job-source adapters, ingestion and data quality
- `database-engineer`: schema, migrations and query design
- `security-reviewer`: independent security review (read-only)
- `code-reviewer`: independent code review (read-only)
- `qa-verifier`: independent behavior and test verification (read-only)
- `mcp-researcher`: MCP/tool discovery and evaluation; never installs or connects tools

Parallelize independent research and read-only reviews. Avoid concurrent edits to shared files. The main Agent owns integration, actual verification and final acceptance.

## Automatic skills

Cursor discovers project skills and makes them available to Agent. HireFlow skills remain eligible for automatic selection; the main Agent should select them based on the task. Manual skill invocation is not required.

Available skills: product discovery, feature implementation, AI/ML development, job-source integration, MCP evaluation, cost optimization, security review, release readiness, marketing website and SEO.

## Automatic quality workflow

For substantial work: inspect â†’ plan â†’ automatically delegate relevant specialists â†’ implement coordinated work â†’ independently review â†’ verify â†’ report actual evidence. Handle trivial work directly. Add independent security review for sensitive user data, authentication, uploads, external accounts and AI data flows.

## Deliberately not configured
- No global Cursor settings or User Rules.
- No `.cursor/mcp.json`: MCP servers are not installed or connected automatically. Evaluate each need and obtain approval first.
- No automatic deployment, Git commit/push, destructive database migration or paid-provider provisioning hooks.
- No assumptions about the actual framework or package scripts; inspect the repository before use.

Review and adapt globs in `.cursor/rules/` after the repository's actual folder structure is confirmed.