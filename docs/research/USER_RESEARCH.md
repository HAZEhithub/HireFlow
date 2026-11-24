# User Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Synthesis of competitor workflows (official pages) + known job-seeker tool stacks. **No primary interviews were conducted in this pass.**  
**Confidence:** Medium for qualitative pain points (repeated across competitor positioning); **Low for market sizes and willingness-to-pay numbers** — previous drafts contained unsourced TAM figures and are withdrawn.  

See [SOURCE_REGISTER.md](SOURCE_REGISTER.md) C-01–C-21.

**Architecture note (2026-11-20):** Job Search Intelligence (market trends, skills demand, location relevance, application performance) is **not** inferred from this desk research. It is deferred to Phase 8 until HireFlow has curated ATS data and user pipeline data. Do not invent market sizes or demand stats.

---

## Method limitations

This is **not** statistically sampled user research. It is persona design from:

1. What competitors choose to sell and gate (revealed demand).
2. Public job-search workflows those products assume.
3. HireFlow’s stated geography (global, strong India + international).

Anything that looks like a headcount or dollar WTP without a cited survey is a **hypothesis**.

---

## 1. Launch priority (decision)

| Priority | Segment | Why first | Why not later-only |
|----------|---------|-----------|--------------------|
| **P0** | India students, internship seekers, fresh graduates, 0–3 YOE | Fragmented tools, ATS pain, free-tier fit, India+remote+intl intent | Need distinct onboarding language and internship filters |
| **P0** | India/international early-career tech and adjacent | Same workspace; ATS public boards are dense here | Must not become “SWE-only” UI |
| **P1** | Career changers | Skill-translation is a real gap no tracker owns | Needs match explanations + resume narrative, not a separate app |
| **P1** | Remote / visa-aware seekers | Filter and labeling problem, not a new product | Work-auth fields in profile |
| **P2** | Experienced non-tech, returners, contractors | High need, different copy and templates | After the core loop works |
| **P3** | Executive / management-only | Coaches and retained search already exist | Do not design P0 around them |

**Withdrawn:** treating US mid-level software engineers paying $30–50/mo as the launch design center.

---

## 2. Shared problems (qualitative)

Observed across tracker, resume, and board products:

1. **Fragmentation** — discovery, resume versions, applications, and interview prep live in different apps.
2. **Opaque matching** — scores without “why,” often implying hire odds.
3. **Stale and duplicate listings** — aggregators optimize volume.
4. **Resume vs job mismatch** — keyword tools (Jobscan, Resume Worded) are a separate paid step.
5. **Tracker fatigue** — Huntr/Teal/Careerflow exist because spreadsheets fail; free tiers cap jobs or AI.
6. **Closed boards** — Naukri/LinkedIn have no public aggregation API; users already visit those pages.

India-specific overlays (hypothesis, labeled as such):

- Campus and internship calendars (not just “full-time SWE”).
- Family involvement in first-job decisions; clarity beats jargon.
- Cost sensitivity: a $40/mo tracker is a hard sell.
- International applications need work-authorization honesty, not fake visa badges.

---

## 3. Personas (launch set)

### Persona A — Fresh graduate, India (P0)

- **Goal:** First full-time role in India or remote.
- **Jobs:** Internshala/Naukri/LinkedIn/college WhatsApp + a few company career pages.
- **Pain:** Resume looks like a transcript; ATS silence; no idea which jobs are expired.
- **HireFlow job:** Import resume, complete profile, see explained matches, track 20–80 applications without paying.
- **Journey:** Marketing → Start Free → resume upload → review extraction → Discover → save → tailor (user-approved) → mark Applied → follow-up reminder.

### Persona B — Internship seeker / student (P0)

- **Goal:** Summer or semester internship, possibly conversion.
- **Pain:** Internship vs full-time filters are messy; dates and stipends missing; academic calendar.
- **HireFlow job:** Employment-type = internship; availability dates; same tracker.

### Persona C — Early-career professional, 1–3 YOE (P0)

- **Goal:** Step-up role, maybe abroad/remote.
- **Pain:** Tailoring every JD; parallel processes; recruiter emails unlinked.
- **HireFlow job:** Multiple resume versions, match breakdown, pipeline stages.

### Persona D — Career changer (P1)

- **Goal:** Translate prior work into a new title family.
- **Pain:** Keyword scanners punish non-literal skill names.
- **HireFlow job:** Explainable gaps + “do not fabricate skills”; learning suggestions later (P2).

### Persona E — International / remote seeker (P1)

- **Goal:** Roles that honestly list location and sponsorship.
- **Pain:** “Remote” that is US-only; missing visa fields.
- **HireFlow job:** Structured location/work-auth preferences; never invent sponsorship.

Deferred personas (documented, not designed against in Phase 1): experienced non-tech, returners, freelancers, managers. Journeys reuse the same objects (profile, jobs, resumes, applications).

---

## 4. Core journey (all P0 personas)

```
Visit www (understand product, no login wall)
  → Start Free (return URL preserved)
  → Create account
  → Optional resume upload → review/correct extraction
  → Preferences: titles, locations, remote, internship vs full-time, work auth
  → Discover permitted jobs + import/clip others
  → Read match explanation
  → Save / start application record
  → Choose resume version (Phase 3)
  → Track stage, notes, follow-up (Phase 4)
  → Extension clips a page already open (Phase 5)
```

Failure states that must be designed: empty job index, expired job, AI provider off, parse failure, permission denied, offline.

---

## 5. What users expect free vs paid

**Fact (competitor gating, 2026-11-20):** boards are free for seekers; Huntr Pro $40/mo; Careerflow Premium ~$24/mo; Teal+ independently reported $29/30 days; Simplify keeps autofill+tracker free; Jobscan Premium ~$50/mo.

**HireFlow decision:** core search + tracker + 2 resumes + explained matches + 5 AI assists/month are free. Paid is extra AI budget, unlimited versions, tailoring, cover letters, analytics — **after** the free loop is real.

---

## 6. Unresolved (need primary research later)

- Actual weekly application volume for India fresh grads.
- Whether internship seekers will import jobs or only use ATS feeds.
- Price test remains open internationally. India Pro is **approved at ₹199/month + applicable GST** (not live). The earlier ₹499 vs $9 hypothesis is superseded for India.
- Accessibility needs of campus computer-lab users (low bandwidth).
