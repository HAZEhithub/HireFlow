---
disable-model-invocation: false
name: hireflow-mcp-evaluation
description: Discover and evaluate MCP servers or external tools for a specific HireFlow workflow without installing or connecting them without permission. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow MCP Evaluation

1. Define the workflow gap and what tool capability is actually needed.
2. Search official MCP registries, vendor docs and the original maintained repository.
3. Compare at least one viable alternative when practical.
4. Evaluate maintainer, recent releases, source code/license, dependency health, permissions, filesystem/network access, secret handling, telemetry and known risks.
5. Determine project-local versus user-global configuration. HireFlow integrations must be project-local where supported; never change global Cursor configuration.
6. Identify required secrets/scopes and costs without asking the user to paste secrets into chat.
7. Recommend least privilege and a verification plan.
8. Present the exact server/config and risks; wait for explicit approval before installation, config changes or account connection.

Never install automatically or recommend granting broad access for convenience.