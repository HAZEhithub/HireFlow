---
disable-model-invocation: false
name: hireflow-ai-ml-development
description: Design and implement HireFlow AI/ML, embeddings, LLM workflows, resume extraction, matching and recommendations with privacy and cost controls. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow AI/ML Development

1. State the task and measurable quality criteria.
2. Establish a deterministic baseline and explain why a model is justified.
3. Inspect local compute, model licenses, provider terms, quality, rate limits and costs.
4. Define sensitive-data boundaries; no third-party transmission of resumes/profile data without explicit informed consent.
5. Add provider abstraction, strict structured output validation, bounded retries/quotas and fallback behavior.
6. Defend against prompt injection in resumes, job descriptions and retrieved text.
7. Build representative evaluation fixtures and track quality, latency and cost.
8. Test provider outages, malformed output and empty/ambiguous inputs.
9. Document model/prompt versions, limitations and reproducible evaluation results.

Never fabricate resume facts, job requirements, match probabilities or benchmark results.