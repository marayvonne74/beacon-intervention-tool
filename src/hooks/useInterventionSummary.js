import { useState, useCallback } from 'react';
import { loadInterventions } from '../services/storage';

function compute(staff) {
  const allMap = loadInterventions(); // { studentId: [rec, ...] }
  const allRecs = Object.values(allMap).flat();

  const open = allRecs.filter(
    (r) => r.status === 'Pending' || r.status === 'Assigned'
  ).length;
  const inProgress = allRecs.filter((r) => r.status === 'In Progress').length;
  const completed = allRecs.filter((r) => r.status === 'Implemented').length;

  const staffWorkload = staff.map((s) => {
    const mine = allRecs.filter((r) => r.assignedStaffId === s.id);
    return {
      ...s,
      assigned: mine.filter((r) => r.status === 'Assigned').length,
      inProgress: mine.filter((r) => r.status === 'In Progress').length,
      completed: mine.filter((r) => r.status === 'Implemented').length,
    };
  });

  return { open, inProgress, completed, staffWorkload };
}

export function useInterventionSummary(staff) {
  const [summary, setSummary] = useState(() => compute(staff));

  const refresh = useCallback(() => {
    setSummary(compute(staff));
  }, [staff]);

  return { summary, refresh };
}
