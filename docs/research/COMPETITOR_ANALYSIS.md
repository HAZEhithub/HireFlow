# Competitor Analysis

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Official product and pricing pages first; independent roundups only as corroboration  
**Confidence:** High where an official URL was read; Medium where a page 403’d or pricing was unpublished  

Full source IDs: [SOURCE_REGISTER.md](SOURCE_REGISTER.md) C-01–C-21, I-01–I-04.

**Rule:** Competitor marketing metrics (“6x faster”, “3x interviews”, “4X referrals”) are **claims**, not HireFlow facts.

---

## Executive summary

The market is point solutions:

- **Boards:** LinkedIn, Indeed, Glassdoor, Wellfound, Welcome to the Jungle
- **Trackers / copilots:** Teal, Huntr, Careerflow, Simplify, Jobright
- **Resume/ATS:** Jobscan, Resume Worded, Rezi, Kickresume
- **Interview:** Final Round AI, Big Interview
- **Compensation:** Levels.fyi

**Opportunity:** an honest workspace (jobs + explained match + resume versions + tracker) with India + international as a first-class geography and privacy-first AI. **Not** assembling every feature those products sell.

HireFlow will **not** compete on “market trend dashboards” at launch. Job Search Intelligence is Phase 8 after we have real source and pipeline data. Competitor “AI copilot” claims are marketing, not HireFlow proof.

---

## Profiles (official-first)

### LinkedIn Jobs / Premium Career

- **Sources:** C-01, C-02 | **Confidence:** High
- **Value:** Network + jobs; hiring-manager access
- **AI:** Premium writing/coaching features (gated)
- **Jobs:** Largest professional graph; Easy Apply on-platform
- **Tracker / resume builder / extension:** Weak or absent as a career OS
- **Pricing:** Free basic; Premium Career ~$29.99/mo (page: compare-plans)
- **Limitation for HireFlow:** We will not replicate the graph. We will not scrape LinkedIn. Users may **clip** a job they already opened (P0 extension).

### Indeed

- **Sources:** C-03 | **Confidence:** High for AI-context article
- **Value:** Volume aggregator; AI “why you match” context
- **Seeker price:** Free
- **Limitation:** Ads, variable listing quality; no public aggregation API for HireFlow (J-07). Do not scrape.

### Glassdoor

- **Sources:** C-21 (403 this session) | **Confidence:** Medium
- **Value:** Reviews, salaries, interview reports
- **Limitation:** Not a full application OS. HireFlow will not invent review corpora.

### Wellfound

- **Sources:** C-04 | **Confidence:** High
- **Value:** Startup roles, candidate-free, direct hiring managers
- **Limitation:** Startup-only. Not India campus/internship coverage.

### Levels.fyi

- **Sources:** C-05 | **Confidence:** High
- **Value:** Compensation transparency, levels, offer comparison
- **Limitation:** Not a tracker/resume product. HireFlow must not scrape or republish their dataset. Offer calculator in P2 uses **user-entered** numbers plus clearly sourced public figures only.

### Careerflow

- **Sources:** C-06, C-07, C-08 | **Confidence:** High
- **Value:** Tracker + resume + LinkedIn tools + extension + (paid) mock interview
- **Pricing:** Free limited; Premium ~$23.99/mo / $172.99/yr; Premium Plus higher
- **Limitation:** US-centric packaging; AI gated; clutter risk. Closest “suite” competitor.

### Jobright

- **Sources:** C-09 | **Confidence:** Medium (pricing unpublished)
- **Value:** Matched feed, autofill, tailored resume, insider connections pitch
- **Limitation:** Opaque pricing; referral claims unverified. Autofill ≠ auto-submit for HireFlow.

### Teal

- **Sources:** C-10, C-11, I-01 | **Confidence:** Medium-High product, Medium price
- **Value:** Resume versions + tracker + clipper
- **Pricing:** Official pricing 403; independents list Teal+ ~$29/30 days; free unlimited resumes/tracking with limited AI
- **Limitation:** Interview/salary weak. Proof that **unlimited tracking on free** is table stakes.

### Huntr

- **Sources:** C-12, C-13 | **Confidence:** High
- **Value:** Best-in-class kanban tracker + clipper
- **Pricing:** Pro $40/mo ($90/qtr, $160/6mo). Free: AI credits then gate; job cap reported as 100 by help/third parties
- **Limitation:** Not a job board. $40 is steep for India P0 users.

### Simplify

- **Sources:** C-14 | **Confidence:** High
- **Value:** Free Copilot autofill + tracker; Autopilot (apply-for-you) is **paid**
- **Limitation:** HireFlow will follow the Copilot model (preview, user submits) and **never** Autopilot.

### Jobscan

- **Sources:** C-15, I-01 | **Confidence:** Medium
- **Value:** Resume vs JD match rate
- **Pricing:** Independents ~$49.95/mo or $89.95/quarter
- **Limitation:** Users distrust fake “ATS scores.” HireFlow: **compatibility vs this JD**, not a universal ATS oracle.

### Resume Worded

- **Sources:** C-16 | **Confidence:** High features, Low outcome claims
- **Value:** Recruiter-style checks, one free scan
- **Limitation:** No jobs/tracker.

### Rezi

- **Sources:** C-17 | **Confidence:** High
- **Pricing:** Free 1 resume / 3 PDFs; Pro $29/mo; Lifetime $149
- **Limitation:** Builder-only.

### Kickresume

- **Sources:** C-18 | **Confidence:** High
- **Value:** Templates, AI writer, ATS checker gated
- **Limitation:** Tracking/jobs shallow.

### Final Round AI

- **Sources:** C-19 | **Confidence:** High
- **Value:** Live Interview CoPilot
- **HireFlow stance:** Do not copy live/stealth assistance. Practice questions in P1, labeled generated.

### Big Interview

- **Sources:** Pricing 403 | **Confidence:** Low
- **Value:** Curriculum-style interview training
- **Limitation:** Interview-only.

### Welcome to the Jungle (Otta)

- **Sources:** C-20 | **Confidence:** High
- **Value:** Curated roles, fluff-reduced JDs, free for seekers
- **Limitation:** EU/US; not a resume OS.

---

## Feature matrix (coarse)

Legend: Strong / Some / No. Based on official pages 2026-11-20, not exhaustive QA of every product.

| Capability | LinkedIn | Indeed | Wellfound | Levels | Careerflow | Jobright | Teal | Huntr | Simplify | Jobscan | Rezi | Final Round | WTTJ |
|------------|----------|--------|-----------|--------|------------|----------|------|-------|----------|---------|------|-------------|------|
| Job discovery | Strong | Strong | Some | Some | Some | Strong | Some | Some | Some | No | No | No | Strong |
| Explainable match | Some | Some | Some | No | Some | Some | Some | Some | Some | Some | No | No | Some |
| Resume builder | No | No | No | No | Strong | Some | Strong | Some | Some | No | Strong | No | No |
| Tracker | Some | Some | Some | No | Strong | Some | Strong | Strong | Strong | Some | No | No | No |
| Extension | No | No | No | No | Some | Some | Some | Some | Strong | Some | No | No | No |
| Autofill (user submits) | Easy Apply | Indeed Apply | No | No | Some | Strong | Some | Some | Strong | No | No | No | No |
| Auto-apply bot | No | No | No | No | No | Opaque | No | No | Paid Autopilot | No | No | No | No |
| Interview practice | Some | No | No | No | Paid | Some | No | No | No | No | Some | Strong | No |
| Live interview overlay | No | No | No | No | No | No | No | No | No | No | No | Strong | No |
| Salary corpus | Some | Some | Some | Strong | No | No | No | No | No | No | No | No | Some |
| India-first UX | No | Some | No | No | No | No | No | No | No | No | No | No | No |
| Privacy-local AI | No | No | No | No | No | No | No | No | No | No | No | No | No |

---

## Industry expectations

**Free:** seeker job search on boards; a limited tracker; a limited resume scan; company/salary **if the product is a data platform**.

**Paid:** unlimited AI writing, JD tailoring, mock interviews, “ATS scores,” live copilots.

**Genuinely differentiated elsewhere (do not copy blindly):** Levels data network; Glassdoor UGC; Simplify free autofill breadth; Final Round live copilot; Wellfound founder access.

---

## HireFlow implications

1. Beat Huntr on **price honesty** and India fit, not on map-view novelty.
2. Beat Jobscan on **honesty of scoring**.
3. Beat Careerflow on **privacy and focus**, not tool count.
4. Match Simplify on **user-submitted apply**; never Autopilot.
5. Do not compete with LinkedIn as a social network.

Independent roundups I-01–I-04 used only to fill 403 gaps; official pages win on conflict.
