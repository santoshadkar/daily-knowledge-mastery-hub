# PI Planning Board - Daily Concept Mastery ART

**Agile Release Train (ART)**: Daily Micro-Learning & Capability Engineering ART  
**Program Increment (PI)**: PI-2026-Q3  
**Release Train Engineer (RTE)**: RTE Lead  
**Date**: September 11, 2026  

---

## 🎯 Program Increment (PI) Objectives

1. **Daily Concept Rotation Core Engine**: Deliver automated 7:00 AM daily rollover across AI, Agile Coaching, and Leadership Soft Skills tracks.
2. **Multi-Medium Content Hub**: Aggregate top books, articles, podcasts/videos, case studies, and practical exercises per concept.
3. **Automated Notification Service**: Implement 7:00 AM daily email digest dispatching concept overview, key takeaways, and direct study link.
4. **Interactive Learning & Assessment**: Provide audio read-aloud TTS, self-assessment quizzes, interactive notes saving, and past concept search archive.
5. **Quality & Governance Gating**: Achieve 100% test coverage for API endpoints, zero lint warnings, QA approval, and CAB compliance.

---

## 📅 Sprint Allocations & Feature Roadmap

### Sprint 1: Architecture, Governance & Data Foundations
- **Feature 1.1**: Enterprise SAFe setup (`docs/pi_planning_board.md`, `docs/api_spec.json`).
- **Feature 1.2**: Comprehensive Curriculum Database (`src/data/curriculum.js`) spanning AI (Transformers, RAG, Agents, Prompt Engineering), Agile Coaching (SAFe, ICF, Clean Language, Team Dynamics), and Soft Skills (Psychological Safety, Emotional Intelligence, Executive Presence).
- **Feature 1.3**: Zero-Hardcoding Configuration (`.env`) & Server Scaffold (`server.js`).

```
Given I am the daily concept scheduling engine
When clock strikes 07:00 AM local time
Then the active concept index increments to the next topic and sends the morning email notification.
```

### Sprint 2: Web Hub UI & Interactive Mastery Features
- **Feature 2.1**: Dark glassmorphic modern UI layout (`index.html`, `style.css`).
- **Feature 2.2**: Multi-medium concept study tabs (Overview, Books, Articles, Video/Podcasts, Case Studies).
- **Feature 2.3**: Interactive quiz, audio reader, and personal study notes persistence.
- **Feature 2.4**: Email notification trigger simulator and live subscriber panel (`app.js`).

### Sprint 3: Test Automation, QA Audit & CAB Sign-Off
- **Feature 3.1**: Jest/Supertest automated tests for backend endpoints and concept rotation logic (`tests/api.test.js`).
- **Feature 3.2**: QA Test Audit Report (`docs/qa_test_report.md`).
- **Feature 3.3**: Inspect & Adapt (I&A) Retrospective (`docs/retrospective.md`).

---

## 🛡️ ROAM Risk Matrix

| Risk ID | Description | Category | Owner | Mitigation Strategy |
|:---|:---|:---|:---|:---|
| **R-01** | SMTP credentials missing or invalid in `.env` | Resolved | DevOps Lead | Fall back gracefully to local Ethereal/simulation mode with console preview link |
| **R-02** | Timezone mismatch during 7:00 AM cron trigger | Owned | Tech Lead | Use standard system timezone calculation for exact 07:00 local renewal |
| **R-03** | Heavy audio synthesis blocking UI | Mitigated | FE Lead | Native Web Speech API execution in non-blocking browser context |
