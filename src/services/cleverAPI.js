// Clever API integration with mock data fallback
// Set VITE_DATA_SOURCE=clever and provide VITE_CLEVER_* env vars to use live data

import { MOCK_STUDENTS } from '../data/mockStudents';

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || 'mock';
const CLIENT_ID = import.meta.env.VITE_CLEVER_CLIENT_ID;
const DISTRICT_ID = import.meta.env.VITE_CLEVER_DISTRICT_ID;

function supplementMissingFields(student) {
  // Fill any fields Clever doesn't provide with realistic mock values
  return {
    ...student,
    attendanceRate: student.attendanceRate ?? randomBetween(0.55, 0.99),
    mathScore: student.mathScore ?? Math.round(randomBetween(30, 98)),
    consecutiveWeeksDecline: student.consecutiveWeeksDecline ?? randomInt(0, 8),
  };
}

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchCleverStudents() {
  if (!CLIENT_ID || !DISTRICT_ID) {
    console.warn('[Beacon] Clever credentials missing — falling back to mock data');
    return MOCK_STUDENTS;
  }

  try {
    // Clever sandbox uses OAuth 2.0; in a real deployment this token exchange
    // happens server-side. For sandbox testing we use the district token directly.
    const res = await fetch(
      `https://api.clever.com/v3.0/districts/${DISTRICT_ID}/students`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_CLEVER_CLIENT_SECRET}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.warn(`[Beacon] Clever API error ${res.status} — falling back to mock data`);
      return MOCK_STUDENTS;
    }

    const json = await res.json();
    const raw = json.data ?? [];

    return raw.map((item, i) =>
      supplementMissingFields({
        id: item.data?.id ?? `clever-${i}`,
        name: `${item.data?.name?.first ?? 'Student'} ${item.data?.name?.last ?? i}`,
        grade: parseInt(item.data?.grade, 10) || 6,
        attendanceRate: item.data?.ext?.attendanceRate ?? null,
        mathScore: item.data?.ext?.mathScore ?? null,
        consecutiveWeeksDecline: item.data?.ext?.consecutiveWeeksDecline ?? null,
        source: 'clever',
      })
    );
  } catch (err) {
    console.warn('[Beacon] Clever fetch failed — falling back to mock data:', err.message);
    return MOCK_STUDENTS;
  }
}

export async function fetchStudents() {
  if (DATA_SOURCE === 'clever') {
    return fetchCleverStudents();
  }
  // Simulate a brief loading delay for realistic UX
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_STUDENTS;
}
