import { useState, useEffect } from 'react';
import { triageStudent } from '../services/claudeAPI';
import { saveTriageResult, loadTriage, saveInterventions, loadInterventions, updateRecommendation } from '../services/storage';
import { addSnapshot } from '../services/storage';

const STATUS_FLOW = ['Pending', 'Assigned', 'In Progress', 'Implemented'];

const STATUS_COLORS = {
  Pending: 'bg-slate-100 text-slate-600',
  Assigned: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Implemented: 'bg-green-100 text-green-700',
};

export default function TriagePanel({ student, staff, onInterventionUpdate }) {
  const [triage, setTriage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => {
    // Load cached triage result
    const cached = loadTriage()[student.id];
    if (cached) setTriage(cached);

    // Load saved recommendations
    const savedRecs = loadInterventions()[student.id] ?? [];
    setRecommendations(savedRecs);
  }, [student.id]);

  async function runTriage() {
    setLoading(true);
    setError(null);
    try {
      const result = await triageStudent(student);
      setTriage(result);
      saveTriageResult(student.id, result);

      // Only seed recommendations if none exist yet
      const existing = loadInterventions()[student.id] ?? [];
      if (existing.length === 0) {
        const seeded = result.recommendations.map((r) => ({
          ...r,
          status: 'Pending',
          assignedStaffId: null,
          note: '',
          approvedAt: null,
        }));
        setRecommendations(seeded);
        saveInterventions(student.id, seeded);
      }
    } catch (err) {
      setError(err.message || 'Triage failed — check your API key.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(idx) {
    setEditingIdx(idx);
    setEditDraft({ ...recommendations[idx] });
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditDraft({});
  }

  function saveEdit(idx) {
    const updated = [...recommendations];
    updated[idx] = { ...editDraft, approvedAt: Date.now() };
    setRecommendations(updated);
    saveInterventions(student.id, updated);
    setEditingIdx(null);
    onInterventionUpdate(student.id);
  }

  function approveRec(idx) {
    const updated = [...recommendations];
    updated[idx] = { ...updated[idx], approvedAt: Date.now() };
    setRecommendations(updated);
    saveInterventions(student.id, updated);
    onInterventionUpdate(student.id);
  }

  function assignStaff(idx, staffId) {
    const updated = [...recommendations];
    updated[idx] = {
      ...updated[idx],
      assignedStaffId: staffId,
      status: staffId ? 'Assigned' : 'Pending',
    };
    setRecommendations(updated);
    saveInterventions(student.id, updated);
    onInterventionUpdate(student.id);
  }

  function advanceStatus(idx) {
    const current = recommendations[idx].status;
    const nextIdx = STATUS_FLOW.indexOf(current) + 1;
    if (nextIdx >= STATUS_FLOW.length) return;
    const next = STATUS_FLOW[nextIdx];

    const updated = [...recommendations];
    updated[idx] = { ...updated[idx], status: next };

    if (next === 'Implemented') {
      addSnapshot(student.id, {
        timestamp: Date.now(),
        attendanceRate: student.attendanceRate,
        mathScore: student.mathScore,
      });
    }

    setRecommendations(updated);
    saveInterventions(student.id, updated);
    onInterventionUpdate(student.id);
  }

  function updateNote(idx, note) {
    updateRecommendation(student.id, idx, { note });
    const updated = [...recommendations];
    updated[idx] = { ...updated[idx], note };
    setRecommendations(updated);
  }

  const tierColor = {
    1: 'text-green-700 bg-green-50 border-green-200',
    2: 'text-amber-700 bg-amber-50 border-amber-200',
    3: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="animate-expandIn px-6 pb-6 pt-2 bg-white border-t border-slate-100">
      {/* AI Triage Summary */}
      {triage ? (
        <div className={`rounded-lg border p-4 mb-5 text-sm ${tierColor[triage.tier]}`}>
          <div className="font-semibold mb-1">AI Classification: Tier {triage.tier}</div>
          <p>{triage.rationale}</p>
          {triage.historicalNotes && (
            <p className="mt-2 opacity-80 italic">Historical context: {triage.historicalNotes}</p>
          )}
        </div>
      ) : (
        <div className="mb-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Running AI triage…
            </div>
          ) : (
            <div>
              {error && (
                <p className="text-sm text-red-600 mb-2">{error}</p>
              )}
              <button
                onClick={runTriage}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run AI Triage
              </button>
              <p className="text-xs text-slate-400 mt-1">
                Uses Claude AI to classify tier and generate personalized recommendations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Intervention Recommendations
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <RecommendationCard
                key={idx}
                rec={rec}
                idx={idx}
                isEditing={editingIdx === idx}
                editDraft={editDraft}
                staff={staff}
                onStartEdit={() => startEdit(idx)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => saveEdit(idx)}
                onApprove={() => approveRec(idx)}
                onAssignStaff={(id) => assignStaff(idx, id)}
                onAdvanceStatus={() => advanceStatus(idx)}
                onUpdateNote={(note) => updateNote(idx, note)}
                onEditDraftChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Re-run triage */}
      {triage && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={runTriage}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            {loading ? 'Running…' : 'Re-run AI triage'}
          </button>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec, idx, isEditing, editDraft, staff,
  onStartEdit, onCancelEdit, onSaveEdit,
  onApprove, onAssignStaff, onAdvanceStatus, onUpdateNote,
  onEditDraftChange,
}) {
  const STATUS_COLORS = {
    Pending: 'bg-slate-100 text-slate-600',
    Assigned: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Implemented: 'bg-green-100 text-green-700',
  };

  const STATUS_FLOW = ['Pending', 'Assigned', 'In Progress', 'Implemented'];
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(rec.status) + 1];
  const assignedMember = staff.find((s) => s.id === rec.assignedStaffId);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Recommendation {idx + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rec.status]}`}>
            {rec.status}
          </span>
          {rec.approvedAt && (
            <span className="text-xs text-green-600 font-medium">✓ Approved</span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={3}
            value={editDraft.action}
            onChange={(e) => onEditDraftChange({ action: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Owner role"
              value={editDraft.owner}
              onChange={(e) => onEditDraftChange({ owner: e.target.value })}
            />
            <input
              className="flex-1 text-sm border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Timeframe"
              value={editDraft.timeframe}
              onChange={(e) => onEditDraftChange({ timeframe: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSaveEdit}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
            >
              Save & Approve
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-slate-500 text-xs border border-slate-200 rounded hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-700 mb-2">{rec.action}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span>👤 {rec.owner}</span>
            <span>📅 {rec.timeframe}</span>
          </div>

          {/* Staff assignment */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-slate-500 shrink-0">Assign to:</label>
            <select
              value={rec.assignedStaffId || ''}
              onChange={(e) => onAssignStaff(e.target.value || null)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">— Select staff —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
            {assignedMember && (
              <span className="text-xs text-blue-700 font-medium">→ {assignedMember.name}</span>
            )}
          </div>

          {/* Note */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Add implementation note…"
              value={rec.note || ''}
              onChange={(e) => onUpdateNote(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 text-slate-600 placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!rec.approvedAt && (
              <button
                onClick={onApprove}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
            )}
            <button
              onClick={onStartEdit}
              className="px-3 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-100"
            >
              Edit
            </button>
            {nextStatus && (
              <button
                onClick={onAdvanceStatus}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
              >
                Mark {nextStatus}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
