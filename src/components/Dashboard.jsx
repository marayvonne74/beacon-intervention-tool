import { useState, useMemo } from 'react';
import StudentCard from './StudentCard';
import FilterBar from './FilterBar';
import SettingsPanel from './SettingsPanel';
import EmptyState from './EmptyState';
import { useStudents } from '../hooks/useStudents';
import { useStaff } from '../hooks/useStaff';

export default function Dashboard() {
  const { students, loading, error, refreshStudent } = useStudents();
  const { staff, addStaffMember, removeStaffMember } = useStaff();
  const [filters, setFilters] = useState({ tier: 'all', grade: 'all', status: 'all' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filters.tier !== 'all' && s.tier !== parseInt(filters.tier)) return false;
      if (filters.grade !== 'all' && s.grade !== parseInt(filters.grade)) return false;
      if (filters.status !== 'all' && s.interventionStatus !== filters.status) return false;
      return true;
    });
  }, [students, filters]);

  const tierCounts = useMemo(() => ({
    3: students.filter((s) => s.tier === 3).length,
    2: students.filter((s) => s.tier === 2).length,
    1: students.filter((s) => s.tier === 1).length,
  }), [students]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Beacon</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Student Intervention Triage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tier summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              <TierPill tier={3} count={tierCounts[3]} />
              <TierPill tier={2} count={tierCounts[2]} />
              <TierPill tier={1} count={tierCounts[1]} />
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Staff
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <span className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm">Loading student roster…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            Failed to load student data: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filter bar */}
            <div className="mb-5">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                counts={{ shown: filtered.length, total: students.length }}
              />
            </div>

            {/* Student list */}
            {filtered.length === 0 ? (
              <EmptyState
                tier={filters.tier !== 'all' ? parseInt(filters.tier) : 'all'}
                filtered={filters.tier !== 'all' || filters.grade !== 'all' || filters.status !== 'all'}
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    staff={staff}
                    onInterventionUpdate={refreshStudent}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {settingsOpen && (
        <SettingsPanel
          staff={staff}
          onAddStaff={addStaffMember}
          onRemoveStaff={removeStaffMember}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function TierPill({ tier, count }) {
  const colors = {
    3: 'bg-red-100 text-red-700',
    2: 'bg-amber-100 text-amber-700',
    1: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colors[tier]}`}>
      T{tier}: {count}
    </span>
  );
}
