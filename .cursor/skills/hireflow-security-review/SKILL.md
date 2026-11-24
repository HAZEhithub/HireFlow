---
disable-model-invocation: false
name: hireflow-security-review
description: Review HireFlow code and architecture for privacy, authentication, authorization, file handling, AI data flow and integration security. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow Security Review

Review the relevant implementation and threat model for:
- Authentication/session lifecycle and OAuth scope minimization.
- Object-level authorization, IDOR and cross-user data isolation.
- Input/output validation, XSS, CSRF, injection, SSRF and open redirects.
- Resume/document upload, parsing, storage and deletion lifecycle.
- Secrets, error messages, logs, analytics and telemetry.
- AI prompt injection, retrieval isolation and external data transmission.
- API rate limits, abuse, webhooks and background job trust boundaries.
- User consent, revocation, export and deletion.

Classify findings with evidence, severity, impact and remediation. Distinguish confirmed vulnerabilities from recommendations. Never claim legal compliance certification.