import { useState } from 'react';
import { clearAllData } from '../services/storage';

export default function SettingsPanel({ staff, onAddStaff, onRemoveStaff, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!role.trim()) { setError('Role is required.'); return; }
    onAddStaff(name, role);
    setName('');
    setRole('');
    setError('');
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Staff Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Current Staff</h3>
          <ul className="space-y-2 mb-6">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  <span className="text-xs text-slate-400 ml-2">— {s.role}</span>
                </div>
                <button
                  onClick={() => onRemoveStaff(s.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold text-slate-600 mb-3">Add Staff Member</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="Role (e.g. 8th Grade Math Teacher)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Staff Member
            </button>
          </form>
        </div>

        <div className="px-6 pb-5 pt-2 border-t border-slate-100 mt-2">
          <p className="text-[11px] text-slate-400 mb-2 uppercase tracking-widest font-semibold">Danger Zone</p>
          <button
            onClick={() => { clearAllData(); window.location.reload(); }}
            className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset Demo Data
          </button>
          <p className="text-xs text-slate-400 mt-1.5 text-center">
            Clears all triage results, interventions, and staff data.
          </p>
        </div>
      </div>
    </div>
  );
}
