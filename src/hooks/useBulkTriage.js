import { useState, useEffect, useRef, useCallback } from 'react';
import { triageStudent } from '../services/claudeAPI';
import { loadTriage, saveTriageResult, loadInterventions, saveInterventions } from '../services/storage';

// Worker-pool concurrency: keeps exactly `limit` requests in-flight at all times.
// Each worker pulls from the shared queue the moment it finishes, so results
// arrive as fast as possible rather than waiting for a whole batch to finish.
async function runWithConcurrency(items, limit, fn) {
  const queue = [...items];
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await fn(item);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.allSettled(workers);
}

export function useBulkTriage(students, { onStudentComplete } = {}) {
  // Initialise results from localStorage so already-cached students show instantly
  const [triageResults, setTriageResults] = useState(() => {
    const cached = loadTriage();
    const results = {};
    students.forEach((s) => { if (cached[s.id]) results[s.id] = cached[s.id]; });
    return results;
  });

  // 'queued' | 'loading' | 'done' | 'error' — only set for students needing triage
  const [triageStatus, setTriageStatus] = useState(() => {
    const cached = loadTriage();
    const status = {};
    students.forEach((s) => { status[s.id] = cached[s.id] ? 'done' : 'queued'; });
    return status;
  });

  const [progress, setProgress] = useState({ completed: 0, total: 0, running: false });

  // Keep a stable reference to the callback to avoid stale closures
  const onCompleteRef = useRef(onStudentComplete);
  useEffect(() => { onCompleteRef.current = onStudentComplete; }, [onStudentComplete]);

  const started = useRef(false);

  useEffect(() => {
    if (students.length === 0 || started.current) return;
    started.current = true;

    const cached = loadTriage();
    const needsTriage = students.filter((s) => !cached[s.id]);

    if (needsTriage.length === 0) return;

    // Tier 3 first (most urgent), then Tier 2, then Tier 1; within tier by urgency desc
    const ordered = [...needsTriage].sort((a, b) =>
      a.tier !== b.tier ? b.tier - a.tier : b.urgencyScore - a.urgencyScore
    );

    setProgress({ completed: 0, total: ordered.length, running: true });

    let doneCount = 0;

    runWithConcurrency(ordered, 5, async (student) => {
      setTriageStatus((prev) => ({ ...prev, [student.id]: 'loading' }));
      try {
        const result = await triageStudent(student);
        saveTriageResult(student.id, result);

        // Seed recommendations only if none exist yet
        if ((loadInterventions()[student.id] ?? []).length === 0) {
          const seeded = result.recommendations.map((r) => ({
            ...r, status: 'Pending', assignedStaffId: null, note: '', approvedAt: null,
          }));
          saveInterventions(student.id, seeded);
        }

        setTriageResults((prev) => ({ ...prev, [student.id]: result }));
        setTriageStatus((prev) => ({ ...prev, [student.id]: 'done' }));
        doneCount += 1;
        setProgress((prev) => ({ ...prev, completed: doneCount }));
        onCompleteRef.current?.(student.id);
      } catch {
        setTriageStatus((prev) => ({ ...prev, [student.id]: 'error' }));
        doneCount += 1;
        setProgress((prev) => ({ ...prev, completed: doneCount }));
      }
    }).then(() => {
      setProgress((prev) => ({ ...prev, running: false }));
    });
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

  const retryStudent = useCallback(async (student) => {
    setTriageStatus((prev) => ({ ...prev, [student.id]: 'loading' }));
    try {
      const result = await triageStudent(student);
      saveTriageResult(student.id, result);
      setTriageResults((prev) => ({ ...prev, [student.id]: result }));
      setTriageStatus((prev) => ({ ...prev, [student.id]: 'done' }));
      onCompleteRef.current?.(student.id);
    } catch {
      setTriageStatus((prev) => ({ ...prev, [student.id]: 'error' }));
    }
  }, []);

  return { triageResults, triageStatus, progress, retryStudent };
}
