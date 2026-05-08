// localStorage wrappers for interventions, triage results, staff, and effectiveness DB

const KEYS = {
  STAFF: 'beacon_staff',
  INTERVENTIONS: 'beacon_interventions',
  TRIAGE: 'beacon_triage',
  EFFECTIVENESS: 'beacon_effectiveness',
  SNAPSHOTS: 'beacon_snapshots',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export function loadStaff(defaults) {
  const stored = load(KEYS.STAFF, null);
  if (!stored) {
    save(KEYS.STAFF, defaults);
    return defaults;
  }
  return stored;
}

export function saveStaff(staff) {
  save(KEYS.STAFF, staff);
}

// ─── Triage results ───────────────────────────────────────────────────────────

export function loadTriage() {
  return load(KEYS.TRIAGE, {});
}

export function saveTriageResult(studentId, result) {
  const all = loadTriage();
  all[studentId] = result;
  save(KEYS.TRIAGE, all);
}

// ─── Interventions ────────────────────────────────────────────────────────────

export function loadInterventions() {
  return load(KEYS.INTERVENTIONS, {});
}

// interventions[studentId] = array of recommendation objects
export function saveInterventions(studentId, recommendations) {
  const all = loadInterventions();
  all[studentId] = recommendations;
  save(KEYS.INTERVENTIONS, all);
}

export function updateRecommendation(studentId, recIndex, patch) {
  const all = loadInterventions();
  if (!all[studentId]) return;
  all[studentId][recIndex] = { ...all[studentId][recIndex], ...patch };
  save(KEYS.INTERVENTIONS, all);
}

// ─── Effectiveness DB ─────────────────────────────────────────────────────────

export function loadEffectivenessDB() {
  return load(KEYS.EFFECTIVENESS, []);
}

export function addEffectivenessRecord(record) {
  const db = loadEffectivenessDB();
  db.push(record);
  save(KEYS.EFFECTIVENESS, db);
}

// Query for similar profiles: same tier, ±1 grade, ±10% attendance, ±10 score
export function querySimilarInterventions(profile) {
  const db = loadEffectivenessDB();
  return db
    .filter((r) => {
      return (
        r.tier === profile.tier &&
        Math.abs(r.gradeLevel - profile.grade) <= 1 &&
        Math.abs(r.attendanceRate - profile.attendanceRate) <= 0.1 &&
        Math.abs(r.mathScore - profile.mathScore) <= 10 &&
        r.outcomeScore !== undefined
      );
    })
    .sort((a, b) => b.outcomeScore - a.outcomeScore)
    .slice(0, 3);
}

// ─── Snapshots for 30-day tracking ───────────────────────────────────────────

export function loadSnapshots() {
  return load(KEYS.SNAPSHOTS, {});
}

export function addSnapshot(studentId, snapshot) {
  const all = loadSnapshots();
  if (!all[studentId]) all[studentId] = [];
  all[studentId].push(snapshot);
  localStorage.setItem(KEYS.SNAPSHOTS, JSON.stringify(all));
}
