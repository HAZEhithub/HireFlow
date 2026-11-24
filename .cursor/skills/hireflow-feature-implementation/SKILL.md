---
disable-model-invocation: false
name: hireflow-feature-implementation
description: Implement a HireFlow feature safely from requirements through architecture, tests, independent review and delivery reporting. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow Feature Implementation

## Workflow
1. Clarify user outcome and acceptance criteria; inspect current implementation and related docs.
2. Identify affected frontend/backend/data/AI boundaries and dependencies.
3. For significant work, plan file changes, migration/API compatibility, risks and verification before editing.
4. Use the appropriate project subagents for independent analysis or parallelizable tasks. Avoid multiple agents editing the same files.
5. Implement the smallest coherent vertical slice; preserve current patterns.
6. Add tests for behavior, permissions and failure cases.
7. Run targeted tests, type checks and lint/format commands that exist in this repo.
8. Request independent code review and QA verification for substantial changes; address confirmed issues.
9. Update relevant docs and report exact verification results.

## Rules
Never claim incomplete features as complete. Do not delete, migrate destructively, commit, push or deploy without approval.