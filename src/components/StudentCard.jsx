import { useState, useRef } from 'react';
import TriagePanel from './TriagePanel';
import { TIER_COLORS, TIER_LABELS } from '../utils/urgencyScore';
import { loadTriage } from '../services/storage';

const BORDER_CLASSES = {
  1: 'border-l-4 border-l-green-500',
  2: 'border-l-4 border-l-amber-500',
  3: 'border-l-4 border-l-red-500',
};

const STATUS_LABELS = {
  unreviewed: { label: 'Unreviewed', cls: 'bg-slate-100 text-slate-500' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
};

export default function StudentCard({ student, staff, onInterventionUpdate }) {
  const [expanded, setExpanded] = useState(false);
  // In-memory cache: populated after first successful triage so re-expands are instant
  const [cachedTriage, setCachedTriage] = useState(
    () => loadTriage()[student.id] ?? null
  );
  const hasExpandedOnce = useRef(false);

  const colors = TIER_COLORS[student.tier];
  const border = BORDER_CLASSES[student.tier];
  const statusInfo = STATUS_LABELS[student.interventionStatus] || STATUS_LABELS.unreviewed;

  const urgencyColor =
    student.urgencyScore >= 60 ? 'text-red-600' :
    student.urgencyScore >= 35 ? 'text-amber-600' : 'text-green-600';

  function handleToggle() {
    if (!expanded) hasExpandedOnce.current = true;
    setExpanded((v) => !v);
  }

  // autoTriage = true only on the very first expand when no cached result exists
  const autoTriage = hasExpandedOnce.current && !cachedTriage;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm ${border} overflow-hidden transition-shadow hover:shadow-md`}
    >
      <button
        className="w-full text-left px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: name + grade */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: getAvatarColor(student.tier) }}
            >
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 truncate">{student.name}</div>
              <div className="text-xs text-slate-400">Grade {student.grade}</div>
            </div>
          </div>

          {/* Center: stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-600">
            <StatPill label="Attendance" value={`${Math.round(student.attendanceRate * 100)}%`} />
            <StatPill label="Math" value={`${student.mathScore}/100`} />
            {student.consecutiveWeeksDecline > 0 && (
              <StatPill label="Decline" value={`${student.consecutiveWeeksDecline}w`} muted />
            )}
          </div>

          {/* Right: badges */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
              {TIER_LABELS[student.tier]}
            </span>
            <div className="text-right hidden xs:block">
              <div className={`text-base font-bold leading-none ${urgencyColor}`}>
                {student.urgencyScore}
              </div>
              <div className="text-xs text-slate-400">urgency</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full hidden md:inline ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="sm:hidden flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Att: {Math.round(student.attendanceRate * 100)}%</span>
          <span>Math: {student.mathScore}</span>
          {student.consecutiveWeeksDecline > 0 && (
            <span className="text-amber-600">{student.consecutiveWeeksDecline}w declining</span>
          )}
          <span className={`ml-auto font-semibold ${urgencyColor}`}>
            Urgency: {student.urgencyScore}
          </span>
        </div>
      </button>

      {expanded && (
        <TriagePanel
          student={student}
          staff={staff}
          autoTriage={autoTriage}
          cachedTriage={cachedTriage}
          onTriageComplete={(result) => setCachedTriage(result)}
          onInterventionUpdate={onInterventionUpdate}
        />
      )}
    </div>
  );
}

function StatPill({ label, value, muted }) {
  return (
    <div className="text-center">
      <div className={`font-semibold ${muted ? 'text-amber-600' : 'text-slate-700'}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function getAvatarColor(tier) {
  return tier === 3 ? '#dc2626' : tier === 2 ? '#d97706' : '#16a34a';
}
