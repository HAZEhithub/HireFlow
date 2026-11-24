# Resume Studio

**Date:** 2026-11-21  
**Status:** Implemented (Phase 3)

Resume Studio is the authenticated document workspace at `/resumes`. It is a structured editor with import, analysis, job compatibility, tailoring, and export — not a chatbot.

## User journey

1. Create a blank resume or upload PDF / DOCX / TXT.
2. Review extracted fields. Nothing is copied to the career profile unless the user opts in.
3. Edit in a live-preview editor. Autosave writes a working copy; the original version stays frozen.
4. Analyze completeness and writing quality (transparent definition, not an ATS score).
5. Compare against a real HireFlow job with requirement-to-evidence notes.
6. Tailor: accept, reject, or edit each suggestion, then save a **new** resume.
7. Export PDF (`@react-pdf/renderer`) or DOCX (`docx`). Downloads are authenticated.

## Plans

- **Free (₹0):** studio, parse, export, two resume documents, deterministic analysis and matching, limited tailoring (counts toward the two-document cap).
- **Pro (₹199/month + applicable GST):** unlimited resume documents. Billing is **not** live; checkout stays disabled.

## Non-goals

- No paid AI providers.
- No unpaid Gemini for resumes.
- No invented metrics, employers, dates, or skills.
- No automatic applications or recruiter messages.
- Cover letters and the rest of the Application Pack remain Phase 5 placeholders.
