# Beacon — Student Intervention Triage Tool

## Purpose

Beacon is a K-12 school counselor and administrator tool that:
1. Pulls student roster data (Clever API or mock fallback)
2. Uses AI (Claude) to triage each student into MTSS Tier 1/2/3
3. Surfaces at-risk students sorted by urgency
4. Enables collaborative assignment and tracking of interventions
5. Learns from past intervention outcomes to improve future recommendations

---

## Component Structure

```
src/
├── App.jsx                    — Root; renders <Dashboard />
├── index.css                  — Tailwind base + custom utilities
├── data/
│   ├── mockStudents.js        — 30 seeded students (Tier 1/2/3 mix)
│   └── staffRoster.js         — 5 pre-seeded staff members
├── services/
│   ├── cleverAPI.js           — Clever API integration + mock fallback
│   ├── claudeAPI.js           — Claude AI triage calls (claude-sonnet-4-20250514)
│   └── storage.js             — All localStorage read/write helpers
├── hooks/
│   ├── useStudents.js         — Fetches + enriches students (urgency, tier, status)
│   ├── useStaff.js            — Staff roster state + persistence
│   └── useEffectiveness.js    — Outcome snapshot + effectiveness DB helpers
├── utils/
│   └── urgencyScore.js        — computeUrgencyScore(), classifyTier(), tier colors
└── components/
    ├── Dashboard.jsx          — Main layout: header, filter bar, student list
    ├── FilterBar.jsx          — Tier / grade / status filters
    ├── StudentCard.jsx        — Collapsed student row with expand button
    ├── TriagePanel.jsx        — AI triage display + recommendation workflow
    ├── SettingsPanel.jsx      — Staff roster management modal
    └── EmptyState.jsx         — Friendly empty-state messages
```

---

## Data Models

### Student
```js
{
  id: string,
  name: string,
  grade: number,             // 6, 7, or 8
  attendanceRate: number,    // 0.0 – 1.0
  mathScore: number,         // 0 – 100
  consecutiveWeeksDecline: number,
  source: 'mock' | 'clever',
  // Computed after fetch:
  tier: 1 | 2 | 3,
  urgencyScore: number,      // 0–100, composite score
  interventionStatus: 'unreviewed' | 'in-progress' | 'resolved',
}
```

### Recommendation
```js
{
  action: string,            // Specific intervention description
  owner: string,             // Role (e.g. "School Counselor")
  timeframe: string,         // e.g. "Begin within 1 week"
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Implemented',
  assignedStaffId: string | null,
  note: string,              // Implementation note from assigned staff
  approvedAt: number | null, // Unix timestamp when counselor approved
}
```

### StaffMember
```js
{
  id: string,
  name: string,
  role: string,
}
```

### EffectivenessRecord
```js
{
  id: string,
  studentId: string,
  tier: 1 | 2 | 3,
  gradeLevel: number,
  attendanceRate: number,    // Baseline at time of implementation
  mathScore: number,         // Baseline at time of implementation
  interventionDescription: string,
  interventionOwner: string,
  assignedStaff: string,
  implementedAt: number,     // Unix timestamp
  outcomeScore: number,      // 0–100, computed from 30-day delta
}
```

---

## Urgency Score

Composite score 0–100 (higher = more urgent):
- **Attendance urgency** (50%): `(1 - attendanceRate) * 100`
- **Math urgency** (30%): `100 - mathScore`
- **Decline urgency** (20%): `min(weeksDecline, 10) * 10`

Tier classification:
- **Tier 3**: attendance < 75% OR math score < 55
- **Tier 2**: attendance < 90% OR math score < 75
- **Tier 1**: all other students

---

## API Dependencies

| Service | Key env var | Notes |
|---------|------------|-------|
| Anthropic Claude | `VITE_ANTHROPIC_API_KEY` | Uses `claude-sonnet-4-20250514`; falls back to mock triage if key absent |
| Clever API | `VITE_CLEVER_CLIENT_ID`, `VITE_CLEVER_CLIENT_SECRET`, `VITE_CLEVER_DISTRICT_ID` | Optional; app runs fully on mock data without these |

---

## Switching Data Sources

Set `VITE_DATA_SOURCE` in `.env`:

```
VITE_DATA_SOURCE=mock    # Default — uses src/data/mockStudents.js
VITE_DATA_SOURCE=clever  # Fetches from Clever sandbox API
```

Without a `VITE_ANTHROPIC_API_KEY`, triage falls back to a realistic rule-based mock that still demonstrates the full UI flow.

---

## localStorage Keys

| Key | Content |
|-----|---------|
| `beacon_staff` | Staff roster array |
| `beacon_triage` | Map of studentId → triage result |
| `beacon_interventions` | Map of studentId → recommendations array |
| `beacon_effectiveness` | Array of EffectivenessRecord |
| `beacon_snapshots` | Map of studentId → snapshot array |

---

## Development

```bash
npm install
cp .env.example .env   # Add your API keys
npm run dev            # http://localhost:5173
npm run build
```
