import { useState, useEffect } from 'react';
import { fetchStudents } from '../services/cleverAPI';
import { computeUrgencyScore, classifyTier } from '../utils/urgencyScore';
import { loadInterventions } from '../services/storage';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents()
      .then((raw) => {
        const interventions = loadInterventions();
        const enriched = raw
          .map((s) => {
            const tier = classifyTier(s);
            const urgencyScore = computeUrgencyScore(s);
            const recs = interventions[s.id] ?? [];
            const status = deriveStatus(recs);
            return { ...s, tier, urgencyScore, interventionStatus: status };
          })
          .sort((a, b) => b.urgencyScore - a.urgencyScore);
        setStudents(enriched);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function refreshStudent(studentId) {
    const interventions = loadInterventions();
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const recs = interventions[s.id] ?? [];
        return { ...s, interventionStatus: deriveStatus(recs) };
      })
    );
  }

  return { students, loading, error, refreshStudent };
}

function deriveStatus(recommendations) {
  if (!recommendations || recommendations.length === 0) return 'unreviewed';
  const statuses = recommendations.map((r) => r.status);
  if (statuses.every((s) => s === 'Implemented')) return 'resolved';
  if (statuses.some((s) => s === 'In Progress' || s === 'Assigned' || s === 'Implemented')) return 'in-progress';
  return 'unreviewed';
}
