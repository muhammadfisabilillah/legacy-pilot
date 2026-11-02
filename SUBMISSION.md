# Devpost submission — LegacyPilot

> Fill the `TBD` fields before submitting. Everything else is ready to paste.

## Project name

**LegacyPilot**

## One-line pitch

An AI remote control for software that has no API — describe a task and an agent operates the app for you, with human approval for risky actions.

## Description (150–300 words)

Clinics, warehouses, and government offices still run critical software that has no integration API. Staff copy data between screens by hand, and traditional RPA scripts break whenever the UI changes.

LegacyPilot is an AI remote control for those applications. You describe a task in plain language — for example, "register Rina Kusuma for the dental clinic tomorrow at 10:00" — and an agent operates the real app for you. It reads the screen, identifies fields and buttons, fills forms, handles validation errors, and asks a human when information is missing or ambiguous.

The demo ships with a deliberately old-fashioned clinic information system covering patient registration and pharmacy stock, but the approach is general: any browser-based legacy app can be controlled through its UI. AI is central, not a chatbot bolted onto a dashboard. An LLM plans each step, selects from a small, constrained set of Playwright actions, and verifies the result on screen. A server-side guardrail intercepts destructive actions such as deleting a schedule and waits for explicit human approval. Every action appears in a live audit timeline alongside a streamed view of the browser.

LegacyPilot shows how AI can unlock software that was written off as un-automatable — without migrations, APIs, or brittle scripts. It turns "we cannot integrate with that system" into "describe what you need and approve the risky parts."

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4
- Playwright + Chromium for browser automation
- Chrome DevTools Protocol (CDP) screencast for the live browser view
- Server-Sent Events (SSE) for real-time state, steps, and frames
- OpenRouter API with LLM tool calling for planning
- Docker for deployment (Render blueprint included)

## Team info

- TBD — name, email
- TBD — name, email
- TBD — name, email
- TBD — name, email

(1–4 members; remove unused lines.)

## Challenge track

TBD — confirm the available tracks on Devpost. Suggested positioning: main track / "Remote Control AI".

## Links

- Source code: https://github.com/muhammadfisabilillah/legacy-pilot
- Demo video: TBD (YouTube unlisted or Loom)
- Live demo: TBD (Render/Fly URL)
- Screenshots: optional

---

## Demo video script (2–3 minutes)

**0:00–0:20 — Hook**
"This is a clinic information system from 2009. It has no API. Today, someone has to type every registration by hand. LegacyPilot lets an AI operate it for you."

Show the legacy app: old layout, patient table, pharmacy stock.

**0:20–0:45 — The product**
Cut to the console. Show the command box, live browser view, and audit timeline.
"The agent never calls an API. It reads the screen and uses the same UI a human would."

**0:45–1:35 — Happy path**
Run: "Daftarkan pasien baru bernama Rina Kusuma, NIK 3201010101010004, telepon 081234567804, lahir 1990-06-15, poli Gigi, besok jam 10:00, keluhan sakit gigi."

Narrate the steps as they appear: navigate, fill name/NIK/phone, select poli, fill date/time, submit. Point at the success message and queue number. Highlight the audit timeline.

**1:35–2:05 — Human-in-the-loop**
Run: "Hapus jadwal A-002."
The agent clicks Hapus and the approval dialog appears. Explain that the server, not the model, enforces the gate. Approve, then show the deletion and success message.

**2:05–2:35 — Ambiguity handling**
Run: "Daftarkan pasien baru Dewi Lestari, NIK 3201010101010005, besok pagi."
The agent asks for the missing phone, poli, and time instead of guessing. Answer, show the completed registration.

**2:35–3:00 — Close**
"LegacyPilot turns 'we cannot integrate with that system' into 'describe the task and approve the risky parts.' One container, any browser-based legacy app."

## Judging criteria mapping

| Criterion | How LegacyPilot addresses it |
|---|---|
| **Creativity** | Remote control of no-API legacy software through its own UI; agent as operator, not chatbot |
| **Use of AI** | LLM plans every step, chooses constrained tools, verifies results, asks for missing data |
| **Usefulness** | Targets real RPA/integration cost in clinics, warehouses, and administration |
| **Execution** | Working end-to-end demo: live stream, audit log, server-enforced approval gate, Docker deploy |

## Pre-submission checklist

- [ ] Public GitHub repo with this README
- [ ] `OPENROUTER_API_KEY` not committed (`.env*` is gitignored)
- [ ] Demo video recorded (2–3 minutes, audio clear)
- [ ] Live demo deployed and reset to seed data
- [ ] OpenRouter credits available (free models allow only 50 requests/day; a demo run uses 5–12)
- [ ] Team names and emails filled in above
- [ ] Challenge track selected on Devpost
- [ ] Description word count between 150 and 300
- [ ] Source link and video link pasted into Devpost
- [ ] Submit before **4 Nov 2026, 5:00 PM PST** (5 Nov 2026, 08:00 WIB)
